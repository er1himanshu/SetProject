import os
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from ..database import SessionLocal
from ..services.storage import save_upload
from ..services.image_quality import analyze_image
from ..services.mismatch_detector import check_image_text_similarity
from ..models import ImageResult
from ..config import MAX_FILE_SIZE, ALLOWED_EXTENSIONS
from typing import Optional
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def validate_file(file: UploadFile) -> None:
    """Validate uploaded file for size and type."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")
    
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}")
    
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail=f"File too large. Maximum size: {MAX_FILE_SIZE / (1024*1024):.0f}MB")
    
    if file_size == 0:
        raise HTTPException(status_code=400, detail="File is empty")

@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...), 
    description: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """Upload and analyze a product image."""
    file_path = None
    try:
        validate_file(file)
        
        if description:
            description = description.strip()[:500]
            
        file_path, unique_filename = save_upload(file)
        logger.info(f"File uploaded: {unique_filename}")
        
        # Analyze image quality
        analysis = analyze_image(file_path, description)

        if analysis is None:
            if file_path and os.path.exists(file_path):
                os.remove(file_path)
            raise HTTPException(status_code=400, detail="Invalid or corrupted image file. Please upload a valid image.")
        
        # Run mismatch detection if description provided
        mismatch_result = None
        if description and description.strip():
            try:
                mismatch_result = check_image_text_similarity(file_path, description)
            except Exception as e:
                logger.warning(f"Mismatch detection failed: {str(e)}")
                mismatch_result = {
                    "has_mismatch": False,
                    "similarity_score": None,
                    "message": "Image-text mismatch detection is unavailable"
                }

        # --- NEW LOGIC: Sync CLIP results with overall analysis & suggestions ---
        final_passed = analysis.get("passed", False)
        final_reason = analysis.get("reason", "OK")

        if mismatch_result and mismatch_result.get("has_mismatch"):
            final_passed = False # Force the overall image to fail
            
            # Update the main reason
            if final_reason == "OK" or not final_reason:
                final_reason = "Failed: Image does not match the product description."
            else:
                final_reason = f"{final_reason} | Also failed: Image-Text Mismatch."

            # Override the old consistency field for the UI table
            analysis["description_consistency"] = "Mismatch Detected"

            # Add a dynamic suggestion for the user
            current_suggestions = analysis.get("improvement_suggestions", "")
            mismatch_suggestion = "Ensure the description accurately matches the product's specific colors and visual details, or upload the correct image."
            if current_suggestions:
                analysis["improvement_suggestions"] = f"{current_suggestions}; {mismatch_suggestion}"
            else:
                analysis["improvement_suggestions"] = mismatch_suggestion
                
        elif mismatch_result and not mismatch_result.get("has_mismatch"):
            # Explicitly confirm it is consistent if CLIP approves
            analysis["description_consistency"] = "Consistent"

        # Store result in database
        result = ImageResult(
            filename=unique_filename,
            width=analysis["width"],
            height=analysis["height"],
            blur_score=analysis["blur_score"],
            brightness_score=analysis["brightness_score"],
            contrast_score=analysis["contrast_score"],
            passed=final_passed,
            reason=final_reason,
            description=description,
            aspect_ratio=analysis.get("aspect_ratio"),
            sharpness_score=analysis.get("sharpness_score"),
            background_score=analysis.get("background_score"),
            has_watermark=analysis.get("has_watermark", False),
            description_consistency=analysis.get("description_consistency"),
            improvement_suggestions=analysis.get("improvement_suggestions"),
            has_mismatch=mismatch_result["has_mismatch"] if mismatch_result else False,
            similarity_score=mismatch_result["similarity_score"] if mismatch_result else None,
            mismatch_message=mismatch_result["message"] if mismatch_result else None
        )
        db.add(result)
        db.commit()
        db.refresh(result)
        
        return {
            "message": "Image uploaded and analyzed successfully",
            "result_id": result.id,
            "passed": result.passed
        }
        
    except HTTPException:
        raise
    except SQLAlchemyError as e:
        if file_path and os.path.exists(file_path):
            try: os.remove(file_path)
            except: pass
        logger.error(f"Database error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Database error occurred.")
    except Exception as e:
        if file_path and os.path.exists(file_path):
            try: os.remove(file_path)
            except: pass
        logger.error(f"Upload error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="An error occurred during upload.")