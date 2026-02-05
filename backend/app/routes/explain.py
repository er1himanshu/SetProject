"""
API endpoint for CLIP explainability with attention rollout
"""

import os
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from typing import Optional
import logging

from ..services.storage import save_upload
from ..services.explainability import generate_clip_explanation
from ..services.mismatch_detector import MismatchDetectionUnavailableError
from ..config import MAX_FILE_SIZE, ALLOWED_EXTENSIONS, MISMATCH_THRESHOLD

router = APIRouter()
logger = logging.getLogger(__name__)


def validate_file(file: UploadFile) -> None:
    """
    Validate uploaded file for size and type.
    
    Args:
        file: Uploaded file object
        
    Raises:
        HTTPException: If validation fails
    """
    # Validate file extension
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")
    
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Check file size
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to beginning
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE / (1024*1024):.0f}MB"
        )
    
    if file_size == 0:
        raise HTTPException(status_code=400, detail="File is empty")


@router.post("/explain")
async def explain_clip_similarity(
    file: UploadFile = File(...),
    description: str = Form(...),
    threshold: Optional[float] = Form(None)
):
    """
    Generate CLIP explainability with attention rollout heatmap.
    
    This endpoint analyzes an image-text pair using CLIP and generates a visual
    explanation showing which parts of the image most influenced the similarity score.
    
    Args:
        file: Image file to analyze (max 10MB, jpg/png/gif/webp)
        description: Product description to compare against the image (min 10 chars)
        threshold: Optional custom similarity threshold (0-1, lower = stricter)
        
    Returns:
        dict: Explanation results including:
            - similarity_score: CLIP similarity score (0-1)
            - has_mismatch: Boolean indicating if mismatch detected
            - message: Human-readable status message
            - heatmap_base64: Base64-encoded heatmap overlay image (PNG)
            - explanation: Description of the heatmap visualization
            
    Raises:
        HTTPException: If validation fails or model unavailable (503)
    """
    file_path = None
    try:
        # Validate file
        validate_file(file)
        
        # Validate description
        if not description or description.strip() == "":
            raise HTTPException(
                status_code=400,
                detail="Description is required for CLIP explanation"
            )
        
        # Sanitize and validate description length
        description = description.strip()
        if len(description) < 10:
            raise HTTPException(
                status_code=400,
                detail="Description must be at least 10 characters long"
            )
        if len(description) > 500:
            description = description[:500]  # Truncate to limit
        
        # Validate threshold if provided
        if threshold is not None:
            if not 0 <= threshold <= 1:
                raise HTTPException(
                    status_code=400,
                    detail="Threshold must be between 0 and 1"
                )
        else:
            threshold = MISMATCH_THRESHOLD
        
        # Save file temporarily
        file_path, unique_filename = save_upload(file)
        logger.info(f"Generating CLIP explanation for file: {unique_filename}")
        
        # Generate explanation with attention rollout
        result = generate_clip_explanation(file_path, description, threshold)
        
        logger.info(f"CLIP explanation generated: {result['message']}")
        
        return {
            "filename": unique_filename,
            "description": description,
            "similarity_score": result["similarity_score"],
            "has_mismatch": result["has_mismatch"],
            "threshold": threshold,
            "message": result["message"],
            "heatmap_base64": result["heatmap_base64"],
            "explanation": result["explanation"],
            "is_fallback": result.get("is_fallback", False)  # Include fallback flag
        }
        
    except HTTPException:
        # Clean up file on validation errors
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass
        raise
    except MismatchDetectionUnavailableError as e:
        # CLIP model unavailable - return specific error
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass
        
        logger.warning(f"CLIP model unavailable for explanation: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail="CLIP explainability is currently unavailable. The AI model required for this feature is not accessible."
        )
    except ValueError as e:
        # Validation errors from explanation generation
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass
        
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    except FileNotFoundError as e:
        # File not found error
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass
        
        logger.error(f"Image file error: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail="Image file could not be processed."
        )
    except Exception as e:
        # Clean up file on any error
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as cleanup_error:
                logger.error(f"Error cleaning up file {file_path}: {str(cleanup_error)}")
        
        logger.error(f"CLIP explanation error: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred during explanation generation: {str(e)}"
        )
    finally:
        # Clean up temporary file if it still exists (for successful requests)
        # Exception handlers already clean up on errors
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
                logger.debug(f"Cleaned up temporary file: {file_path}")
            except Exception as cleanup_error:
                logger.error(f"Error cleaning up file {file_path}: {str(cleanup_error)}")
