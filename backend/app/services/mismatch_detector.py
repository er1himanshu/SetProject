"""
Image-Text Mismatch Detection using CLIP (Contrastive Language-Image Pre-training)

This module provides functionality to detect mismatches between product images and 
their descriptions using a pretrained multimodal CLIP model.
"""

import logging
from typing import Tuple, Optional, List
import re
import torch
from PIL import Image
from transformers import CLIPProcessor, CLIPModel
from ..config import MISMATCH_THRESHOLD, CLIP_MODEL_NAME

logger = logging.getLogger(__name__)

# Global model cache to avoid reloading on every request
_model_cache = {}

# Error message constant
MISMATCH_DETECTION_UNAVAILABLE_MSG = "Image-text mismatch detection is unavailable"

# Common product categories for ecommerce
PRODUCT_CATEGORIES = [
    "shoes", "boots", "sneakers", "sandals",
    "bike", "bicycle", "motorcycle",
    "bag", "handbag", "backpack", "purse",
    "dress", "shirt", "pants", "jeans", "jacket", "coat",
    "watch", "sunglasses", "glasses",
    "phone", "laptop", "camera", "electronics",
    "furniture", "chair", "table", "sofa",
    "jewelry", "necklace", "ring", "bracelet",
    "toy", "doll", "action figure",
    "book", "notebook"
]

# Related category groups (for avoiding false positive mismatches)
# Categories in the same group are considered related and won't trigger category mismatch messages
RELATED_CATEGORY_GROUPS = [
    {"shoes", "boots", "sneakers", "sandals"},
    {"bike", "bicycle", "motorcycle"},
    {"bag", "handbag", "backpack", "purse"},
    {"dress", "shirt", "pants", "jeans", "jacket", "coat"},
    {"jewelry", "necklace", "ring", "bracelet"},  # Watch is separate (wearable tech vs. jewelry)
]

# Category detection confidence threshold
CATEGORY_CONFIDENCE_THRESHOLD = 0.3


class MismatchDetectionUnavailableError(Exception):
    """Raised when mismatch detection is not available (e.g., model not loaded)."""
    pass


def get_clip_model():
    """
    Load and cache the CLIP model and processor.
    
    Returns:
        Tuple[CLIPModel, CLIPProcessor]: The loaded model and processor
        
    Raises:
        MismatchDetectionUnavailableError: If model cannot be loaded
    """
    if 'model' not in _model_cache:
        logger.info(f"Loading CLIP model: {CLIP_MODEL_NAME}")
        try:
            # Try to load from local cache only (fail fast if not available)
            model = CLIPModel.from_pretrained(CLIP_MODEL_NAME, local_files_only=True)
            processor = CLIPProcessor.from_pretrained(CLIP_MODEL_NAME, local_files_only=True)
            _model_cache['model'] = model
            _model_cache['processor'] = processor
            logger.info("CLIP model loaded successfully from local cache")
        except Exception as e:
            logger.info(f"CLIP model not available locally: {type(e).__name__}")
            # Mark model as unavailable - don't retry downloading
            _model_cache['model'] = None
            _model_cache['processor'] = None
            raise MismatchDetectionUnavailableError(
                "CLIP model is not available locally. Image-text mismatch detection will be skipped."
            ) from e
    
    # Check if model loading previously failed
    if _model_cache.get('model') is None:
        raise MismatchDetectionUnavailableError(
            "CLIP model is not available. Image-text mismatch detection will be skipped."
        )
    
    return _model_cache['model'], _model_cache['processor']


def extract_category_from_text(text: str) -> Optional[str]:
    """
    Extract product category from description text.
    Returns the longest matching category to prioritize more specific terms.
    
    Args:
        text: Product description text
        
    Returns:
        Optional[str]: Detected category or None if not found
    """
    if not text:
        return None
    
    text_lower = text.lower()
    
    # Find all matching categories
    matches = []
    for category in PRODUCT_CATEGORIES:
        # Use word boundaries to match whole words
        pattern = r'\b' + re.escape(category) + r'\b'
        if re.search(pattern, text_lower):
            matches.append(category)
    
    # Return the longest match (most specific)
    if matches:
        return max(matches, key=len)
    
    return None


def detect_image_category(image_path: str, categories: List[str] = None) -> Tuple[Optional[str], Optional[float]]:
    """
    Detect the most likely category for an image using CLIP.
    
    Args:
        image_path: Path to the image file
        categories: List of categories to check (uses PRODUCT_CATEGORIES if None)
        
    Returns:
        Tuple[Optional[str], Optional[float]]: 
            - best_category: Most likely category or None
            - confidence: Confidence score (0-1) or None
    """
    if categories is None:
        categories = PRODUCT_CATEGORIES
    
    try:
        # Load model and processor
        model, processor = get_clip_model()
        
        # Load and process image
        image = Image.open(image_path).convert("RGB")
        
        # Prepare text prompts for each category
        # Use template to make it more specific to product images
        text_prompts = [f"a photo of {category}" for category in categories]
        
        # Prepare inputs
        inputs = processor(
            text=text_prompts,
            images=image,
            return_tensors="pt",
            padding=True
        )
        
        # Get model outputs
        with torch.no_grad():
            outputs = model(**inputs)
        
        # Get similarity scores for each category
        logits_per_image = outputs.logits_per_image  # Shape: (1, num_categories)
        probs = logits_per_image.softmax(dim=1).squeeze(0)  # Convert to probabilities
        
        # Find the best matching category
        best_idx = probs.argmax().item()
        best_category = categories[best_idx]
        confidence = probs[best_idx].item()
        
        logger.info(f"Image category detected: {best_category} (confidence: {confidence:.2f})")
        
        return best_category, float(confidence)
        
    except MismatchDetectionUnavailableError:
        logger.warning("Category detection unavailable: CLIP model not loaded")
        return None, None
    except Exception as e:
        logger.warning(f"Category detection failed: {type(e).__name__}: {str(e)}")
        return None, None


def detect_mismatch(image_path: str, description: str, threshold: Optional[float] = None) -> Tuple[bool, Optional[float], str]:
    """
    Detect if there's a mismatch between an image and its description using CLIP.
    
    Args:
        image_path: Path to the image file
        description: Text description of the product
        threshold: Optional custom threshold for mismatch detection
        
    Returns:
        Tuple[bool, Optional[float], str]: 
            - is_mismatch: True if mismatch detected, False otherwise
            - similarity_score: Similarity score between 0 and 1, or None if detection unavailable
            - message: Human-readable message about the result
    """
    # Handle empty or missing description
    if not description or description.strip() == "":
        return False, 1.0, "No description provided"
    
    # Use default threshold if not provided
    if threshold is None:
        threshold = MISMATCH_THRESHOLD
    
    try:
        # Load model and processor
        model, processor = get_clip_model()
        
        # Load and process image
        image = Image.open(image_path).convert("RGB")
        
        # Prepare inputs
        inputs = processor(
            text=[description], 
            images=image, 
            return_tensors="pt", 
            padding=True
        )
        
        # Get model outputs and calculate raw cosine similarity
        with torch.no_grad():
            outputs = model(**inputs)
            
            # Extract the raw embeddings
            image_embeds = outputs.image_embeds
            text_embeds = outputs.text_embeds
            
            # Apply L2 normalization to the vectors
            image_embeds = image_embeds / image_embeds.norm(p=2, dim=-1, keepdim=True)
            text_embeds = text_embeds / text_embeds.norm(p=2, dim=-1, keepdim=True)
            
            # Calculate cosine similarity (dot product of normalized vectors)
            cosine_sim = torch.matmul(image_embeds, text_embeds.t()).item()
            
            # Ensure the score is bounded for the UI
            similarity_score = max(0.0, float(cosine_sim))
        
        # Determine if there's a mismatch using the provided threshold
        is_mismatch = similarity_score < threshold
        
        # Enhanced messaging: Check category mismatch if basic mismatch detected
        message = ""
        if is_mismatch:
            # Try to detect category mismatch for more specific messaging
            description_category = extract_category_from_text(description)
            image_category, category_confidence = detect_image_category(image_path)
            
            if description_category and image_category and category_confidence:
                # Check if categories are different (allowing for related terms)
                # Consider it a category mismatch if they're completely different
                if description_category != image_category and category_confidence > CATEGORY_CONFIDENCE_THRESHOLD:
                    # Check if they're related (e.g., shoes vs sneakers, bike vs bicycle)
                    are_related = any(
                        description_category in group and image_category in group 
                        for group in RELATED_CATEGORY_GROUPS
                    )
                    
                    if not are_related:
                        message = (
                            f"Mismatch detected: Description says '{description_category}', "
                            f"but image looks like '{image_category}' (score: {similarity_score:.2f})"
                        )
                    else:
                        message = f"Mismatch detected (score: {similarity_score:.2f})"
                else:
                    message = f"Mismatch detected (score: {similarity_score:.2f})"
            else:
                message = f"Mismatch detected (score: {similarity_score:.2f})"
        else:
            message = f"Match confirmed (score: {similarity_score:.2f})"
        
        logger.info(f"Mismatch detection: {message}")
        
        return is_mismatch, float(similarity_score), message
        
    except FileNotFoundError as e:
        logger.error(f"Image file not found: {image_path}")
        raise FileNotFoundError(f"Image file not found: {image_path}") from e
    except MismatchDetectionUnavailableError:
        # CLIP model is unavailable - return gracefully without failing
        logger.warning("Mismatch detection unavailable: CLIP model not loaded")
        return False, None, MISMATCH_DETECTION_UNAVAILABLE_MSG
    except Exception as e:
        # For other errors, log and return unavailable status
        logger.warning(f"Mismatch detection failed: {type(e).__name__}: {str(e)}")
        return False, None, MISMATCH_DETECTION_UNAVAILABLE_MSG


def check_image_text_similarity(image_path: str, description: str, threshold: Optional[float] = None) -> dict:
    """
    Check similarity between image and text description with detailed results.
    
    Args:
        image_path: Path to the image file
        description: Text description of the product
        threshold: Optional custom threshold (uses config default if None)
        
    Returns:
        dict: Detailed results including mismatch status, score, and message
    """
    if threshold is None:
        threshold = MISMATCH_THRESHOLD
    
    is_mismatch, similarity_score, message = detect_mismatch(image_path, description, threshold)
    
    return {
        "has_mismatch": is_mismatch,
        "similarity_score": similarity_score,  # Can be None if detection unavailable
        "threshold": threshold,
        "message": message,
        "description_provided": bool(description and description.strip())
    }