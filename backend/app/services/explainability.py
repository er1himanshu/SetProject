"""
CLIP Explainability using Vision Transformer (ViT) Attention Rollout

This module provides functionality to visualize which parts of an image
contribute most to CLIP's similarity score using attention rollout from
the Vision Transformer layers.
"""

import logging
import base64
import io
from typing import Tuple, Optional
import numpy as np
import torch
from PIL import Image
import cv2
from transformers import CLIPProcessor, CLIPModel

from .mismatch_detector import get_clip_model, MismatchDetectionUnavailableError
from ..config import CLIP_MODEL_NAME, ENABLE_ATTENTION_FALLBACK, FALLBACK_HEATMAP_TYPE

logger = logging.getLogger(__name__)


def compute_attention_rollout(attentions: torch.Tensor, discard_ratio: float = 0.9) -> np.ndarray:
    """
    Compute attention rollout from ViT attention maps.
    
    Attention rollout progressively multiplies attention weights across layers,
    identifying which image patches most influence the final representation.
    
    Args:
        attentions: Attention weights from all transformer layers
                   Shape: (num_layers, num_heads, num_patches, num_patches)
        discard_ratio: Ratio of lowest attention weights to discard per layer (0-1)
    
    Returns:
        np.ndarray: Rolled out attention map (num_patches,)
        
    Raises:
        ValueError: If attentions tensor is None or has invalid dimensions
    """
    # Guard: Check for None or empty tensor
    if attentions is None:
        raise ValueError("Attention tensor cannot be None")
    
    if attentions.numel() == 0:
        raise ValueError("Attention tensor is empty (expected tensor with elements > 0)")
    
    # Average attention across all heads
    attentions = torch.mean(attentions, dim=1)  # (num_layers, num_patches, num_patches)
    
    # Add residual connections (identity matrix)
    residual_att = torch.eye(attentions.size(1)).to(attentions.device)
    aug_att_mat = attentions + residual_att
    aug_att_mat = aug_att_mat / aug_att_mat.sum(dim=-1, keepdim=True)
    
    # Progressively multiply attention matrices through layers (rollout)
    joint_attentions = torch.zeros(aug_att_mat.size()).to(attentions.device)
    joint_attentions[0] = aug_att_mat[0]
    
    for i in range(1, aug_att_mat.size(0)):
        joint_attentions[i] = torch.matmul(aug_att_mat[i], joint_attentions[i-1])
    
    # Get attention from CLS token to all patches (last layer)
    # CLS token is at index 0
    v = joint_attentions[-1]
    attention_map = v[0, 1:]  # Exclude CLS token itself
    
    return attention_map.cpu().numpy()


def create_heatmap_overlay(
    image_path: str,
    attention_map: np.ndarray,
    grid_size: int = 7,
    alpha: float = 0.5
) -> Image.Image:
    """
    Create a heatmap overlay on the original image based on attention weights.
    
    Args:
        image_path: Path to the original image
        attention_map: 1D array of attention weights for each patch
        grid_size: Size of the attention grid (e.g., 7x7 for 49 patches)
        alpha: Transparency of heatmap overlay (0=transparent, 1=opaque)
    
    Returns:
        PIL.Image: Image with heatmap overlay
    """
    # Load original image
    original_img = Image.open(image_path).convert("RGB")
    img_array = np.array(original_img)
    
    # Reshape attention map to grid
    attention_grid = attention_map.reshape(grid_size, grid_size)
    
    # Normalize attention values to 0-255 range
    attention_grid = (attention_grid - attention_grid.min()) / (attention_grid.max() - attention_grid.min() + 1e-8)
    attention_grid = (attention_grid * 255).astype(np.uint8)
    
    # Resize heatmap to match image dimensions
    heatmap = cv2.resize(attention_grid, (img_array.shape[1], img_array.shape[0]), interpolation=cv2.INTER_CUBIC)
    
    # Apply colormap (COLORMAP_JET for red-yellow-blue gradient)
    heatmap_colored = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)
    heatmap_colored = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)
    
    # Blend with original image
    overlayed = cv2.addWeighted(img_array, 1 - alpha, heatmap_colored, alpha, 0)
    
    return Image.fromarray(overlayed)


def encode_image_to_base64(image: Image.Image, format: str = "PNG") -> str:
    """
    Encode PIL Image to base64 string.
    
    Args:
        image: PIL Image object
        format: Image format (PNG, JPEG, etc.)
    
    Returns:
        str: Base64-encoded image string
    """
    buffer = io.BytesIO()
    image.save(buffer, format=format)
    buffer.seek(0)
    img_bytes = buffer.getvalue()
    return base64.b64encode(img_bytes).decode('utf-8')


def generate_gradient_heatmap(image_path: str, alpha: float = 0.3) -> Image.Image:
    """
    Generate a simple gradient heatmap as a fallback visualization.
    
    Creates a center-focused radial gradient overlay to indicate general
    importance pattern when full attention rollout is unavailable.
    
    Args:
        image_path: Path to the original image
        alpha: Transparency of gradient overlay (0=transparent, 1=opaque)
    
    Returns:
        PIL.Image: Image with gradient overlay
    """
    # Load original image
    original_img = Image.open(image_path).convert("RGB")
    img_array = np.array(original_img)
    h, w = img_array.shape[:2]
    
    # Create radial gradient (center-focused)
    y, x = np.ogrid[:h, :w]
    center_y, center_x = h // 2, w // 2
    
    # Calculate distance from center
    dist_from_center = np.sqrt((x - center_x)**2 + (y - center_y)**2)
    max_dist = np.sqrt(center_x**2 + center_y**2)
    
    # Normalize and invert (center has high attention)
    gradient = 1.0 - (dist_from_center / max_dist)
    gradient = np.clip(gradient, 0, 1)
    
    # Convert to 0-255 range
    gradient_normalized = (gradient * 255).astype(np.uint8)
    
    # Apply colormap
    heatmap_colored = cv2.applyColorMap(gradient_normalized, cv2.COLORMAP_JET)
    heatmap_colored = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)
    
    # Blend with original image
    overlayed = cv2.addWeighted(img_array, 1 - alpha, heatmap_colored, alpha, 0)
    
    return Image.fromarray(overlayed)


def generate_fallback_explanation(
    image_path: str,
    description: str,
    similarity_score: float,
    threshold: float,
    fallback_reason: str
) -> dict:
    """
    Generate a fallback explanation when full attention visualization is unavailable.
    
    This function provides a graceful degradation path that still returns useful
    information to the user, including the similarity score and a simplified
    visualization.
    
    Args:
        image_path: Path to the image file
        description: Text description
        similarity_score: CLIP similarity score (0-1)
        threshold: Similarity threshold for mismatch detection
        fallback_reason: Human-readable explanation of why attention is unavailable
    
    Returns:
        dict: Fallback explanation results with is_fallback=True flag
    """
    logger.info(f"Generating fallback explanation: {fallback_reason}")
    
    # Determine if mismatch based on threshold
    is_mismatch = similarity_score < threshold
    
    # Generate appropriate message
    if is_mismatch:
        message = f"Mismatch detected (score: {similarity_score:.2f})"
    else:
        message = f"Match confirmed (score: {similarity_score:.2f})"
    
    # Generate fallback visualization based on config
    if FALLBACK_HEATMAP_TYPE == "gradient":
        # Create a simple gradient heatmap
        heatmap_image = generate_gradient_heatmap(image_path, alpha=0.3)
        explanation = (
            "Showing simplified center-focused attention pattern. "
            "Full attention rollout visualization is unavailable because: " + fallback_reason + ". "
            "The similarity score is still accurate and based on CLIP's full analysis."
        )
    else:
        # Return original image
        original_img = Image.open(image_path).convert("RGB")
        heatmap_image = original_img
        explanation = (
            "Showing original image. Full attention heatmap is unavailable because: " + fallback_reason + ". "
            "The similarity score is still accurate and based on CLIP's full analysis."
        )
    
    # Encode image to base64
    heatmap_base64 = encode_image_to_base64(heatmap_image, format="PNG")
    
    return {
        "similarity_score": float(similarity_score),
        "has_mismatch": is_mismatch,
        "message": message,
        "heatmap_base64": heatmap_base64,
        "explanation": explanation,
        "is_fallback": True  # Flag indicating this is a fallback response
    }


def generate_clip_explanation(
    image_path: str,
    description: str,
    threshold: Optional[float] = None
) -> dict:
    """
    Generate CLIP explanation with attention rollout heatmap.
    
    This function attempts to generate a full attention visualization. If attention
    data is unavailable (due to model limitations or configuration), it gracefully
    falls back to providing the similarity score with a simplified visualization.
    
    Args:
        image_path: Path to the image file
        description: Text description to compare with image
        threshold: Optional similarity threshold
    
    Returns:
        dict: Explanation results including similarity score and heatmap
              May include is_fallback=True if full attention is unavailable
    
    Raises:
        MismatchDetectionUnavailableError: If CLIP model is not available
        ValueError: If inputs are invalid
    """
    # Validate inputs
    if not description or description.strip() == "":
        raise ValueError("Description is required for explanation generation")
    
    # Set default threshold if not provided
    if threshold is None:
        from ..config import MISMATCH_THRESHOLD
        threshold = MISMATCH_THRESHOLD
    
    try:
        # Load CLIP model and processor
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
        
        # Try to get model outputs with attention weights
        with torch.no_grad():
            try:
                # Attempt to get attention outputs
                outputs = model(**inputs, output_attentions=True)
            except TypeError as e:
                # Model doesn't support output_attentions parameter
                logger.warning(f"CLIP model does not support attention output: {str(e)}")
                
                # Calculate similarity score without attention
                if ENABLE_ATTENTION_FALLBACK:
                    outputs = model(**inputs)
                    logits_per_image = outputs.logits_per_image
                    similarity_score = torch.sigmoid(logits_per_image / 100.0).item()
                    
                    return generate_fallback_explanation(
                        image_path=image_path,
                        description=description,
                        similarity_score=similarity_score,
                        threshold=threshold,
                        fallback_reason="the CLIP model does not support attention visualization"
                    )
                else:
                    raise Exception("CLIP model does not support attention output and fallback is disabled")
        
        # Calculate similarity score
        logits_per_image = outputs.logits_per_image
        similarity_score = torch.sigmoid(logits_per_image / 100.0).item()
        
        # Extract vision attention weights
        vision_attentions = outputs.vision_model_output.attentions
        
        # Check if attention outputs are available - use fallback if not
        if vision_attentions is None or len(vision_attentions) == 0:
            logger.warning("Attention outputs are not available from CLIP model")
            
            if ENABLE_ATTENTION_FALLBACK:
                return generate_fallback_explanation(
                    image_path=image_path,
                    description=description,
                    similarity_score=similarity_score,
                    threshold=threshold,
                    fallback_reason="the model did not generate attention outputs"
                )
            else:
                raise ValueError(
                    "Attention outputs are not available from the CLIP model. "
                    "This may occur if the model does not support attention visualization "
                    "or if the model architecture has changed."
                )
        
        # Check for None tensors in attention list - use fallback if found
        if any(att is None for att in vision_attentions):
            logger.warning("Some attention tensors are missing (None)")
            
            if ENABLE_ATTENTION_FALLBACK:
                return generate_fallback_explanation(
                    image_path=image_path,
                    description=description,
                    similarity_score=similarity_score,
                    threshold=threshold,
                    fallback_reason="some attention tensors are incomplete"
                )
            else:
                raise ValueError(
                    "Some attention tensors are missing (None). "
                    "The model may not have generated complete attention outputs."
                )
        
        # Attempt to process attention tensors - fallback on any error
        try:
            # Stack attention tensors from all layers
            # Shape: (num_layers, batch_size, num_heads, num_patches, num_patches)
            attention_stack = torch.stack(vision_attentions)
            attention_stack = attention_stack.squeeze(1)  # Remove batch dimension
            
            # Compute attention rollout
            attention_map = compute_attention_rollout(attention_stack)
            
            # Determine grid size from model architecture
            import math
            num_patches = attention_map.shape[0]
            grid_size = int(math.sqrt(num_patches))
            
            # Create heatmap overlay
            heatmap_image = create_heatmap_overlay(
                image_path=image_path,
                attention_map=attention_map,
                grid_size=grid_size,
                alpha=0.5
            )
            
            # Encode heatmap to base64
            heatmap_base64 = encode_image_to_base64(heatmap_image, format="PNG")
            
            # Determine if mismatch
            is_mismatch = similarity_score < threshold
            
            # Generate message
            if is_mismatch:
                message = f"Mismatch detected (score: {similarity_score:.2f})"
            else:
                message = f"Match confirmed (score: {similarity_score:.2f})"
            
            logger.info(f"Generated CLIP explanation with full attention: {message}")
            
            return {
                "similarity_score": float(similarity_score),
                "has_mismatch": is_mismatch,
                "message": message,
                "heatmap_base64": heatmap_base64,
                "explanation": "Heatmap shows which image regions most influenced the similarity score. Warmer colors (red/yellow) indicate higher attention.",
                "is_fallback": False  # Full attention visualization available
            }
            
        except Exception as e:
            # Error during attention processing - use fallback
            logger.warning(f"Error processing attention tensors: {type(e).__name__}: {str(e)}")
            
            if ENABLE_ATTENTION_FALLBACK:
                return generate_fallback_explanation(
                    image_path=image_path,
                    description=description,
                    similarity_score=similarity_score,
                    threshold=threshold,
                    fallback_reason=f"attention processing encountered an error ({type(e).__name__})"
                )
            else:
                raise
        
    except MismatchDetectionUnavailableError:
        logger.warning("CLIP model unavailable for explanation generation")
        raise
    except FileNotFoundError as e:
        logger.error(f"Image file not found: {image_path}")
        raise FileNotFoundError(f"Image file not found: {image_path}") from e
    except ValueError as e:
        # Re-raise validation errors (unless they're about attention and fallback is enabled)
        logger.error(f"Validation error: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Error generating CLIP explanation: {type(e).__name__}: {str(e)}")
        raise Exception(f"Failed to generate explanation: {str(e)}") from e
