// frontend/src/KeywordSearchPage.jsx
import { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = 'http://127.0.0.1:8000';

const LoadingSpinner = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const BulkIndexer = () => {
    const [files, setFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});
  
    const handleFileSelect = (selectedFiles) => {
      setFiles(Array.from(selectedFiles));
      setUploadProgress({});
    };
  
    const handleUpload = async () => {
      if (files.length === 0) return;
      setIsUploading(true);
      const progress = {};
      for (const file of files) {
        const formData = new FormData();
        formData.append('resume_file', file);
        try {
          await axios.post(`${API_BASE_URL}/index/`, formData);
          progress[file.name] = 'success';
        } catch (err) {
          progress[file.name] = 'error';
        }
        setUploadProgress({ ...progress });
      }
      setIsUploading(false);
    };
  
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 className="text-xl font-bold text-teal-300 mb-4">📚 Bulk Resume Indexing</h3>
        <p className="text-sm text-slate-400 mb-4">Add multiple new resumes to the Vector Database at once. This is a crucial step to enable the search features.</p>
        <div className="border border-dashed border-white/30 rounded-lg p-8 text-center">
          <label className="relative cursor-pointer text-cyan-400 hover:text-cyan-300 font-semibold bg-slate-700/50 p-3 rounded-lg border border-slate-600">
            <span>{files.length > 0 ? `${files.length} file(s) selected` : "Select Resumes"}</span>
            <input type="file" className="sr-only" multiple accept=".pdf,.docx" onChange={(e) => handleFileSelect(e.target.files)} />
          </label>
        </div>
        <div className="mt-6">
          <button onClick={handleUpload} disabled={isUploading || files.length === 0} className="w-full py-3 bg-teal-600 hover:bg-teal-700 rounded-lg font-bold text-lg disabled:bg-slate-500/50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center">
            {isUploading ? 'Indexing...' : `Index ${files.length} Resumes`}
          </button>
        </div>
        {Object.keys(uploadProgress).length > 0 && (
          <div className="mt-4 space-y-2">
            <h3 className="font-semibold text-slate-300">Upload Status:</h3>
            {Object.entries(uploadProgress).map(([filename, status]) => (
              <div key={filename} className={`flex justify-between items-center p-2 rounded-md ${status === 'success' ? 'bg-green-800/50' : 'bg-red-800/50'}`}>
                <span className="text-sm truncate">{filename}</span>
                <span className={`text-xs font-bold ${status === 'success' ? 'text-green-300' : 'text-red-300'}`}>{status.toUpperCase()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

const KeywordSearchPage = () => {
    const [keywords, setKeywords] = useState('');
    const [searchResults, setSearchResults] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async () => {
        if (!keywords.trim()) {
            setError('Please enter at least one keyword.');
            return;
        }
        setIsSearching(true);
        setError('');
        setSearchResults(null);

        const keywordsList = keywords.split(',').map(kw => kw.trim()).filter(kw => kw.length > 0);

        try {
            const response = await axios.post(`${API_BASE_URL}/keyword-search/`, { keywords: keywordsList });
            setSearchResults(response.data.top_matches);
        } catch (err) {
            console.error("Search failed:", err);
            setError(err.response?.data?.detail || 'An error occurred during the search.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleReset = () => {
        setKeywords('');
        setSearchResults(null);
        setError('');
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="bg-black/20 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg p-6 md:p-8 space-y-8">
                <h2 className="text-3xl font-bold text-cyan-400 mb-6">Keyword Search</h2>
                <p className="text-sm text-slate-400">Search the indexed resumes for specific skills or keywords.</p>
                
                <div className="space-y-4">
                    <textarea
                        className="w-full p-4 bg-slate-700/50 rounded-lg border border-slate-600 text-white placeholder-slate-400"
                        rows="4"
                        placeholder="Enter keywords separated by commas (e.g., Python, React, Data Science)"
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                    ></textarea>
                    <button
                        onClick={handleSearch}
                        disabled={isSearching || !keywords.trim()}
                        className="w-full py-3 bg-teal-600 hover:bg-teal-700 rounded-lg font-bold text-lg disabled:bg-slate-500/50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center"
                    >
                        {isSearching ? <><LoadingSpinner /> Searching...</> : 'Search Resumes'}
                    </button>
                </div>
                {error && <p className="mt-4 text-center text-red-400 font-bold">{error}</p>}
                
                {searchResults && (
                    <AnimatePresence>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                            <div className="mt-8">
                                <h4 className="font-semibold mb-2">Top Matches:</h4>
                                {searchResults.length > 0 ? (
                                    <ul className="space-y-2">
                                        {searchResults.map((match) => (
                                            <li key={match.resume_filename} className="flex justify-between items-center bg-slate-700/50 p-2 rounded-md">
                                                <span>{match.resume_filename}</span>
                                                <span className="font-mono text-cyan-300">{match.score}% match</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : <p className="text-slate-400 text-sm">No similar resumes found for the given keywords.</p>}
                            </div>
                            <button onClick={handleReset} className="w-full mt-6 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg backdrop-blur-sm transition-colors">New Search</button>
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>
            <div className="border-t border-slate-700 pt-8 mt-8">
                <BulkIndexer />
            </div>
        </motion.div>
    );
};

export default KeywordSearchPage;