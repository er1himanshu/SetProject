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
  const navigate = useNavigate(); // Restored to fix routing crash

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
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
      setExplanationError("");
    } catch (err) {
      let errorMsg = "Failed to generate explanation. Please try again.";
      if (err.response) {
        const status = err.response.status;
        const detail = err.response.data?.detail;
        if (status === 503) {
          errorMsg = "⚠️ CLIP explainability is currently unavailable. The AI model required for this feature is not accessible.";
        } else if (status === 400) {
          errorMsg = detail || "Invalid input. Please check your image and description.";
        } else if (status === 500) {
          errorMsg = "An error occurred on the server. Please try again or contact support if the issue persists.";
        } else {
          errorMsg = detail || errorMsg;
        }
      } else if (err.request) {
        errorMsg = "Network error. Please check your connection and try again.";
      }
      setExplanationError(errorMsg);
    } finally {
      setExplanationLoading(false);
    }
  };

  return (
    <div className="card overflow-hidden animate-fade-in relative z-50 shadow-2xl bg-white rounded-2xl">
      <div className="card-header bg-slate-900 p-8">
        <h2 className="text-3xl font-bold text-white mb-2">Upload Product Image</h2>
        <p className="text-slate-300 text-lg">Upload your product image and description for comprehensive quality analysis</p>
      </div>
      
      <div className="p-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Upload Area */}
          <div>
            <label className="block text-base font-bold text-gray-800 mb-4">
              Product Image <span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-300 cursor-pointer group">
              {!preview ? (
                <div>
                  <svg className="mx-auto h-12 w-12 text-gray-400 group-hover:text-blue-500 transition-colors mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="text-gray-600 mb-2">
                    <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-semibold text-blue-600 hover:text-blue-500">
                      <span>Click to upload</span>
                      <input id="file-upload" ref={fileInputRef} type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                    </label>
                    <span className="pl-1">or drag and drop</span>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                </div>
              ) : (
                <div className="relative">
                  <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-lg shadow-lg" />
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setPreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            
            {file && (
              <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-sm text-gray-800">
                  <span className="font-bold text-blue-700">Selected:</span> {file.name}
                </p>
                <p className="text-xs text-gray-600 mt-1 font-medium">
                  Size: {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            )}
          </div>

          {/* Description Area */}
          <div className="relative z-50">
            <label htmlFor="description" className="block text-base font-bold text-gray-800 mb-4">
              Product Description <span className="text-gray-500 font-normal">(Optional, min 10 chars for AI Check)</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows="6"
              className="w-full p-4 text-gray-800 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none shadow-inner transition-all relative z-10"
              placeholder="E.g., Red leather handbag with gold hardware..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
            
            {/* Character Counter */}
            {description && (
              <div className="mt-2 flex items-center justify-between">
                <p className={`text-sm font-medium ${description.trim().length >= 10 ? 'text-green-600' : 'text-orange-500'}`}>
                  {description.trim().length >= 10 ? (
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Ready for AI Analysis
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {10 - description.trim().length} more chars needed
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-500 font-medium">{description.trim().length} / 500 characters</p>
              </div>
            )}

            {/* Action Buttons - Fully isolated click layer */}
            <div className="mt-6 space-y-3 relative z-50">
              <button
                type="button"
                onClick={handleUpload}
                disabled={loading || !file}
                className="w-full py-4 text-lg bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md disabled:opacity-50 transition-colors cursor-pointer"
              >
                {loading ? "Analyzing..." : "Analyze Image Quality"}
              </button>
              
              <button
                type="button"
                onClick={handleExplainRequest}
                disabled={explanationLoading || !file || !description || description.trim().length < 10}
                className="w-full py-4 text-lg bg-white border-2 border-indigo-100 text-indigo-600 hover:bg-indigo-50 font-bold rounded-xl disabled:opacity-50 transition-colors cursor-pointer"
              >
                {explanationLoading ? "Generating AI Vision..." : "🔍 Explain AI Decision"}
              </button>
              
              {resultId && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full py-4 text-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Upload Another Image
                </button>
              )}
            </div>
          </div>
        </div>

        {message && (
          <div className="mt-8 p-5 bg-green-50 border-l-4 border-green-500 rounded-xl shadow-sm animate-slide-in relative z-50">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-green-800 font-bold text-lg">{message}</p>
            </div>
            {resultId && (
              <button
                type="button"
                onClick={() => navigate('/results')}
                className="mt-4 text-sm text-green-700 hover:text-green-800 font-bold underline flex items-center group w-max cursor-pointer"
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
          <div className="mt-8 p-5 bg-red-50 border-l-4 border-red-500 rounded-xl shadow-sm animate-slide-in">
            <div className="flex items-center">
              <p className="text-red-800 font-bold text-lg">⚠️ {error}</p>
            </div>
          </div>
        )}

        {explanationError && (
          <div className="mt-8 p-5 bg-orange-50 border-l-4 border-orange-500 rounded-xl shadow-sm animate-slide-in">
            <div className="flex items-center">
              <p className="text-orange-800 font-bold text-lg">⚠️ {explanationError}</p>
            </div>
          </div>
        )}

        {/* CLIP Explanation Display */}
        {explanation && showExplanation && (
          <div className="mt-8 border-t-2 border-gray-100 pt-8 animate-fade-in relative z-50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">AI Vision Heatmap</h3>
              <button type="button" onClick={() => setShowExplanation(false)} className="text-sm text-gray-500 hover:text-gray-800 underline cursor-pointer">
                Hide Explanation
              </button>
            </div>

            <div className={`p-6 rounded-xl mb-6 shadow-sm border ${explanation.has_mismatch ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`text-xl font-bold mb-1 ${explanation.has_mismatch ? 'text-orange-900' : 'text-green-900'}`}>
                    {explanation.has_mismatch ? '⚠ Description Mismatch' : '✓ Description Matches'}
                  </h4>
                  <p className={`text-sm ${explanation.has_mismatch ? 'text-orange-800' : 'text-green-800'}`}>
                    AI Confidence Score: {(explanation.similarity_score * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-6 shadow-inner border border-gray-200">
              <p className="text-gray-600 mb-4 text-center">
                Warmer colors (red/yellow) indicate where the AI focused to match your description.
              </p>
              <img 
                src={`data:image/png;base64,${explanation.heatmap_base64}`} 
                alt="AI Attention Heatmap" 
                className="max-w-full h-auto rounded-lg shadow-md mx-auto"
                style={{ maxHeight: '400px' }}
              />
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

  if (loading) return <div className="mt-8 text-center"><div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  if (!result) return null;

  const suggestions = result.improvement_suggestions ? result.improvement_suggestions.split(';').map(s => s.trim()).filter(s => s) : [];

  return (
    <div className="mt-8 border-t-2 border-gray-100 pt-8 animate-fade-in">
      {/* Overall Status */}
      <div className={`p-6 rounded-xl mb-8 shadow-sm ${result.passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h4 className={`text-2xl font-bold ${result.passed ? 'text-green-800' : 'text-red-800'}`}>
              {result.passed ? '✓ PASSED' : '✗ FAILED'}
            </h4>
            <p className={`mt-1 font-medium ${result.passed ? 'text-green-700' : 'text-red-700'}`}>
              {result.reason}
            </p>
          </div>
        </div>
      </div>

      {result.has_mismatch && result.similarity_score !== null && (
        <div className="mb-8 p-6 bg-orange-50 border border-orange-300 rounded-xl shadow-sm">
          <h4 className="text-lg font-bold text-orange-900 mb-1">⚠ Image-Text Mismatch Detected</h4>
          <p className="text-orange-800 text-sm">
            {result.mismatch_message || 'The visual content does not match the product description.'}
          </p>
        </div>
      )}

      {/* Quality Checklist */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
          <h4 className="font-bold text-gray-800 mb-4 border-b pb-2">Technical Metrics</h4>
          <div className="space-y-1">
            <MetricRow label="Resolution" value={`${result.width} × ${result.height}`} passed={result.width >= 1000 && result.height >= 1000} />
            <MetricRow label="Aspect Ratio" value={result.aspect_ratio?.toFixed(2)} passed={true} />
            <MetricRow label="Blur Score" value={result.blur_score?.toFixed(2)} passed={result.blur_score >= 100} />
            <MetricRow label="Sharpness" value={result.sharpness_score?.toFixed(2)} passed={result.sharpness_score >= 50} />
            <MetricRow label="Brightness" value={result.brightness_score?.toFixed(2)} passed={result.brightness_score >= 60 && result.brightness_score <= 200} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
          <h4 className="font-bold text-gray-800 mb-4 border-b pb-2">Ecommerce Standards</h4>
          <div className="space-y-1">
            <MetricRow label="Background Quality" value={(result.background_score * 100)?.toFixed(0) + '%'} passed={result.background_score >= 0.7} />
            <MetricRow label="Watermark" value={result.has_watermark ? 'Detected' : 'None'} passed={!result.has_watermark} />
            <MetricRow label="Description Match" value={result.description_consistency || 'N/A'} passed={result.description_consistency === 'Consistent' || result.description_consistency === 'No description provided'} />
          </div>
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 shadow-sm">
          <h4 className="font-bold text-blue-900 mb-4">Improvement Suggestions</h4>
          <ul className="space-y-2">
            {suggestions.map((suggestion, idx) => (
              <li key={idx} className="flex items-start text-blue-900 text-sm">
                <span className="mr-2 text-blue-600 font-bold">•</span>
                <span>{suggestion}</span>
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
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-gray-900">{value}</span>
        {passed ? (
          <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span>
        ) : (
          <span className="w-2.5 h-2.5 bg-red-500 rounded-full"></span>
        )}
      </div>
    </div>
  );
}