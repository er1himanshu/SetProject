import { useState, useRef, useEffect } from "react";
import { uploadImage, fetchResultDetail, explainClipSimilarity } from "../api/client";
import { useNavigate } from "react-router-dom";

export default function UploadForm() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultId, setResultId] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [explanation, setExplanation] = useState(null);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [explanationError, setExplanationError] = useState("");
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select an image file");
      return;
    }
    
    setLoading(true);
    setError("");
    setMessage("");
    
    try {
      const res = await uploadImage(file, description);
      setMessage(`Analysis complete! View detailed results below.`);
      setResultId(res.data.result_id);
      // Don't clear form yet so user can see the preview with results
    } catch (err) {
      setError(err.response?.data?.detail || "Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setDescription("");
    setMessage("");
    setError("");
    setResultId(null);
    setShowExplanation(false);
    setExplanation(null);
    setExplanationError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleViewAllResults = () => {
    navigate("/results");
  };

  const handleExplainRequest = async () => {
    if (!file || !description || description.trim().length < 10) {
      setExplanationError("Please provide an image and a description (at least 10 characters) to generate an explanation.");
      return;
    }

    setExplanationLoading(true);
    setExplanationError("");

    try {
      const res = await explainClipSimilarity(file, description);
      setExplanation(res.data);
      setShowExplanation(true);
      
      // Clear any previous error when successful
      setExplanationError("");
    } catch (err) {
      // Distinguish between different error types
      let errorMsg = "Failed to generate explanation. Please try again.";
      
      if (err.response) {
        const status = err.response.status;
        const detail = err.response.data?.detail;
        
        if (status === 503) {
          // Service unavailable
          errorMsg = "⚠️ CLIP explainability is currently unavailable. The AI model required for this feature is not accessible. Please try again later.";
        } else if (status === 400) {
          // Validation error
          errorMsg = detail || "Invalid input. Please check your image and description.";
        } else if (status === 500) {
          // Server error
          errorMsg = "An error occurred on the server. Please try again or contact support if the issue persists.";
        } else {
          errorMsg = detail || errorMsg;
        }
      } else if (err.request) {
        // Network error
        errorMsg = "Network error. Please check your connection and try again.";
      }
      
      setExplanationError(errorMsg);
    } finally {
      setExplanationLoading(false);
    }
  };

  return (
    <div className="card overflow-hidden animate-fade-in">
      <div className="card-header">
        <h2 className="text-3xl font-bold text-white mb-2">Upload Product Image</h2>
        <p className="text-primary-100 text-lg">Upload your product image and description for comprehensive quality analysis</p>
      </div>
      
      <div className="p-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Upload Area */}
          <div>
            <label className="block text-base font-bold text-gray-800 mb-4">
              Product Image <span className="text-danger-500">*</span>
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary-400 hover:bg-primary-50/30 transition-all duration-200 cursor-pointer">
              {!preview ? (
                <div>
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="text-gray-600 mb-2">
                    <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-semibold text-indigo-600 hover:text-indigo-500">
                      <span>Click to upload</span>
                      <input
                        id="file-upload"
                        ref={fileInputRef}
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </label>
                    <span className="pl-1">or drag and drop</span>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                </div>
              ) : (
                <div className="relative">
                  <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-lg shadow-lg" />
                  <button
                    onClick={() => {
                      setFile(null);
                      setPreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            
            {file && (
              <div className="mt-4 p-4 bg-primary-50 rounded-xl border border-primary-200">
                <p className="text-sm text-gray-800">
                  <span className="font-bold text-primary-700">Selected:</span> {file.name}
                </p>
                <p className="text-xs text-gray-600 mt-1 font-medium">
                  Size: {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            )}
          </div>

          {/* Description Area */}
          <div>
            <label htmlFor="description" className="block text-base font-bold text-gray-800 mb-4">
              Product Description <span className="text-gray-500 font-normal">(Optional, min 10 chars for CLIP)</span>
            </label>
            <textarea
              id="description"
              rows="6"
              className="input-field resize-none"
              placeholder="E.g., Red leather handbag with gold hardware, 12 inch width, featuring multiple compartments and adjustable strap..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
            
            {/* Character Counter */}
            {description && (
              <div className="mt-2 flex items-center justify-between">
                <p className={`text-sm font-medium ${description.trim().length >= 10 ? 'text-success-600' : 'text-warning-600'}`}>
                  {description.trim().length >= 10 ? (
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Ready for CLIP analysis
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {10 - description.trim().length} more character{10 - description.trim().length !== 1 ? 's' : ''} needed
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-500 font-medium">
                  {description.trim().length} / 500 characters
                </p>
              </div>
            )}
            
            <p className="mt-3 text-sm text-gray-600 font-medium">
              💡 Provide a detailed description to check consistency between your image and text using AI
            </p>

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              <button
                onClick={handleUpload}
                disabled={loading || !file}
                className="btn-primary w-full py-4 text-lg"
                title={!file ? "Please select an image first" : ""}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </span>
                ) : (
                  "Analyze Image Quality"
                )}
              </button>
              
              <button
                onClick={handleExplainRequest}
                disabled={explanationLoading || !file || !description || description.trim().length < 10}
                className="btn-secondary w-full py-4 text-lg"
                title={
                  !file ? "Please select an image first" :
                  !description ? "Please provide a description" :
                  description.trim().length < 10 ? "Description must be at least 10 characters" :
                  ""
                }
              >
                {explanationLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating Explanation...
                  </span>
                ) : (
                  "🔍 Explain CLIP Similarity"
                )}
              </button>
              
              {resultId && (
                <button
                  onClick={handleReset}
                  className="btn-secondary w-full py-4 text-lg"
                >
                  Upload Another Image
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className="mt-8 p-5 bg-success-50 border-l-4 border-success-500 rounded-xl shadow-soft animate-slide-in">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-success-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-success-800 font-bold text-lg">{message}</p>
            </div>
            {resultId && (
              <button
                onClick={handleViewAllResults}
                className="mt-4 text-sm text-success-700 hover:text-success-800 font-bold underline flex items-center group"
              >
                View All Results 
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            )}
          </div>
        )}
        
        {error && (
          <div className="mt-8 p-5 bg-danger-50 border-l-4 border-danger-500 rounded-xl shadow-soft animate-slide-in">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-danger-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-danger-800 font-bold text-lg">{error}</p>
            </div>
          </div>
        )}

        {/* Explanation Error */}
        {explanationError && (
          <div className="mt-8 p-5 bg-warning-50 border-l-4 border-warning-500 rounded-xl shadow-soft animate-slide-in">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-warning-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-warning-800 font-bold text-lg">{explanationError}</p>
            </div>
          </div>
        )}

        {/* CLIP Explanation Display */}
        {explanation && showExplanation && (
          <div className="mt-8 border-t-2 border-gray-200 pt-8 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-3xl font-bold text-gray-800 gradient-text">CLIP Explainability</h3>
              <button
                onClick={() => setShowExplanation(false)}
                className="text-sm text-gray-600 hover:text-gray-800 font-semibold underline"
              >
                Hide Explanation
              </button>
            </div>

            {/* Fallback Mode Info Banner */}
            {explanation.is_fallback && (
              <div className="mb-6 p-5 bg-blue-50 border-l-4 border-blue-400 rounded-xl shadow-soft">
                <div className="flex items-start">
                  <svg className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-blue-900 mb-2">
                      ℹ️ Limited Visualization Available
                    </h4>
                    <p className="text-blue-800 text-sm leading-relaxed">
                      Full attention heatmap is unavailable, but the similarity score below is still accurate and based on CLIP's complete analysis. 
                      A simplified visualization is shown as an alternative.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Similarity Score Card */}
            <div className={`p-6 rounded-xl mb-6 shadow-soft ${explanation.has_mismatch ? 'bg-warning-50 border-2 border-warning-200' : 'bg-success-50 border-2 border-success-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className={`text-xl font-bold mb-2 ${explanation.has_mismatch ? 'text-warning-900' : 'text-success-900'}`}>
                    {explanation.has_mismatch ? '⚠ Potential Mismatch' : '✓ Good Match'}
                  </h4>
                  <p className={`text-base mb-3 ${explanation.has_mismatch ? 'text-warning-800' : 'text-success-800'}`}>
                    {explanation.message}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className={`font-bold ${explanation.has_mismatch ? 'text-warning-900' : 'text-success-900'}`}>Similarity Score:</span>
                    <div className="flex items-center gap-2 flex-1 max-w-xs">
                      <div className={`flex-1 rounded-full h-3 ${explanation.has_mismatch ? 'bg-warning-200' : 'bg-success-200'}`}>
                        <div 
                          className={`h-3 rounded-full transition-all ${explanation.has_mismatch ? 'bg-warning-600' : 'bg-success-600'}`}
                          style={{ width: `${(explanation.similarity_score * 100).toFixed(0)}%` }}
                        ></div>
                      </div>
                      <span className={`font-bold ${explanation.has_mismatch ? 'text-warning-900' : 'text-success-900'}`}>
                        {(explanation.similarity_score * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                {explanation.has_mismatch ? (
                  <svg className="w-16 h-16 text-warning-500 flex-shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                ) : (
                  <svg className="w-16 h-16 text-success-500 flex-shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
            </div>

            {/* Heatmap/Image Visualization */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 shadow-soft">
              <h4 className="text-xl font-bold text-gray-800 mb-3 flex items-center">
                <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {explanation.is_fallback ? 'Simplified Visualization' : 'Attention Heatmap'}
              </h4>
              <p className="text-gray-700 mb-4 text-sm">
                {explanation.explanation}
              </p>
              <div className="bg-white rounded-lg p-4 shadow-inner">
                <img 
                  src={`data:image/png;base64,${explanation.heatmap_base64}`} 
                  alt={explanation.is_fallback ? "Simplified Visualization" : "Attention Heatmap"} 
                  className="max-w-full h-auto rounded-lg shadow-lg mx-auto"
                  style={{ maxHeight: '500px' }}
                />
              </div>
              {!explanation.is_fallback && (
                <div className="mt-4 flex items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-4 rounded" style={{ background: 'linear-gradient(to right, #0000ff, #00ffff)' }}></div>
                    <span className="text-gray-700 font-medium">Low Attention</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-4 rounded" style={{ background: 'linear-gradient(to right, #ffff00, #ff0000)' }}></div>
                    <span className="text-gray-700 font-medium">High Attention</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Show detailed results if analysis is complete */}
        {resultId && <ResultsDisplay resultId={resultId} />}
      </div>
    </div>
  );
}

function ResultsDisplay({ resultId }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (resultId) {
      fetchResultDetail(resultId)
        .then((res) => {
          setResult(res.data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Failed to fetch result details:", err);
          setLoading(false);
        });
    }
  }, [resultId]);

  if (loading) {
    return (
      <div className="mt-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p className="mt-2 text-gray-600">Loading results...</p>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const suggestions = result.improvement_suggestions ? result.improvement_suggestions.split(';').map(s => s.trim()).filter(s => s) : [];

  return (
    <div className="mt-8 border-t-2 border-gray-200 pt-8 animate-fade-in">
      <h3 className="text-3xl font-bold text-gray-800 mb-6 gradient-text">Analysis Results</h3>
      
      {/* Overall Status */}
      <div className={`p-8 rounded-xl mb-8 shadow-soft ${result.passed ? 'bg-success-50 border-2 border-success-200' : 'bg-danger-50 border-2 border-danger-200'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h4 className={`text-2xl font-bold ${result.passed ? 'text-success-800' : 'text-danger-800'}`}>
              {result.passed ? '✓ PASSED' : '✗ FAILED'}
            </h4>
            <p className={`mt-2 text-lg ${result.passed ? 'text-success-700' : 'text-danger-700'}`}>
              {result.reason}
            </p>
          </div>
          {result.passed ? (
            <svg className="w-20 h-20 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-20 h-20 text-danger-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
      </div>

      {/* Image-Text Mismatch Warning */}
      {result.has_mismatch && result.similarity_score !== null && (
        <div className="mb-8 p-6 bg-warning-50 border-2 border-warning-400 rounded-xl shadow-soft animate-slide-in">
          <div className="flex items-start">
            <svg className="w-8 h-8 text-warning-600 mr-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <h4 className="text-xl font-bold text-warning-900 mb-2">
                ⚠ Image-Text Mismatch Detected
              </h4>
              <p className="text-warning-800 mb-3 text-base">
                {result.mismatch_message || 'The uploaded image may not match the provided description.'}
              </p>
              <div className="flex items-center gap-4 text-sm">
                <span className="font-bold text-warning-900">Similarity Score:</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-warning-200 rounded-full h-3">
                    <div 
                      className="bg-warning-600 h-3 rounded-full transition-all"
                      style={{ width: `${(result.similarity_score * 100).toFixed(0)}%` }}
                    ></div>
                  </div>
                  <span className="font-bold text-warning-900">{(result.similarity_score * 100).toFixed(1)}%</span>
                </div>
              </div>
              <p className="mt-3 text-sm text-warning-700 font-medium">
                💡 Consider reviewing the product description to ensure it accurately describes the image content.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Image-Text Match Badge */}
      {!result.has_mismatch && result.similarity_score !== null && result.description && (
        <div className="mb-8 p-6 bg-success-50 border-2 border-success-200 rounded-xl shadow-soft">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-success-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-success-800 font-bold text-base">
                ✓ Image and description match well
              </p>
              <div className="flex items-center gap-2 mt-2 text-sm">
                <span className="text-success-700 font-medium">Similarity Score:</span>
                <span className="font-bold text-success-900">{(result.similarity_score * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quality Checklist */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="card border-2 border-primary-100 p-6">
          <h4 className="font-bold text-gray-800 mb-4 flex items-center text-lg">
            <svg className="w-6 h-6 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Quality Metrics
          </h4>
          <div className="space-y-3">
            <MetricRow label="Resolution" value={`${result.width} × ${result.height}`} passed={result.width >= 1000 && result.height >= 1000} />
            <MetricRow label="Aspect Ratio" value={result.aspect_ratio?.toFixed(2)} passed={true} />
            <MetricRow label="Blur Score" value={result.blur_score?.toFixed(2)} passed={result.blur_score >= 100} />
            <MetricRow label="Sharpness" value={result.sharpness_score?.toFixed(2)} passed={result.sharpness_score >= 50} />
            <MetricRow label="Brightness" value={result.brightness_score?.toFixed(2)} passed={result.brightness_score >= 60 && result.brightness_score <= 200} />
            <MetricRow label="Contrast" value={result.contrast_score?.toFixed(2)} passed={true} />
          </div>
        </div>

        <div className="card border-2 border-secondary-100 p-6">
          <h4 className="font-bold text-gray-800 mb-4 flex items-center text-lg">
            <svg className="w-6 h-6 mr-2 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            Ecommerce Standards
          </h4>
          <div className="space-y-3">
            <MetricRow label="Background Quality" value={(result.background_score * 100)?.toFixed(0) + '%'} passed={result.background_score >= 0.7} />
            <MetricRow label="Watermark Detection" value={result.has_watermark ? 'Detected' : 'None'} passed={!result.has_watermark} />
            <MetricRow 
              label="Description Match" 
              value={result.description_consistency || 'N/A'} 
              passed={result.description_consistency === 'Consistent' || result.description_consistency === 'No description provided'} 
            />
          </div>
        </div>
      </div>

      {/* Improvement Suggestions */}
      {suggestions.length > 0 && (
        <div className="bg-primary-50 border-2 border-primary-200 rounded-xl p-6 shadow-soft">
          <h4 className="font-bold text-primary-900 mb-4 flex items-center text-lg">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Improvement Suggestions
          </h4>
          <ul className="space-y-3">
            {suggestions.map((suggestion, idx) => (
              <li key={idx} className="flex items-start text-primary-900">
                <span className="mr-3 text-primary-600 font-bold text-lg">•</span>
                <span className="text-base">{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function MetricRow({ label, value, passed }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-700 font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-gray-900">{value}</span>
        {passed ? (
          <svg className="w-5 h-5 text-success-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-danger-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        )}
      </div>
    </div>
  );
}