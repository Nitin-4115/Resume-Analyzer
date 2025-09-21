// frontend/src/AnalyzerPage.jsx
import { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = 'http://127.0.0.1:8000';

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3.75 3.75M12 9.75l3.75 3.75M3 17.25V6.75A2.25 2.25 0 015.25 4.5h13.5A2.25 2.25 0 0121 6.75v10.5A2.25 2.25 0 0118.75 19.5H5.25A2.25 2.25 0 013 17.25z" />
    </svg>
  );
  
const LoadingSpinner = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
  
const FileInput = ({ onFileSelect, files, title, multiple }) => (
  <div className="border border-dashed border-white/30 rounded-lg p-6 text-center flex flex-col items-center justify-center h-full">
    <UploadIcon />
    <label className="relative cursor-pointer text-cyan-400 hover:text-cyan-300 font-semibold">
      <span>{files.length > 0 ? "Change file(s)" : title}</span>
      <input type="file" className="sr-only" onChange={(e) => onFileSelect(e.target.files)} multiple={multiple} accept=".pdf,.docx" />
    </label>
    <p className="text-xs text-slate-400 mt-1">PDF or DOCX</p>
    {files.length > 0 && (
      <p className="mt-2 text-sm text-green-400 truncate w-full px-2">
        Selected: {files.length} file{files.length > 1 ? 's' : ''}
      </p>
    )}
  </div>
);

const SingleResultDisplay = ({ result, onReset }) => (
  <motion.div key="single-result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.7 }}>
    <h3 className="text-3xl font-bold text-cyan-400 mb-6">Analysis Results</h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg p-4">
        <p className="text-sm text-slate-400">Hard Match</p>
        <p className="text-3xl font-bold">{result.scores.hard_match_percent}%</p>
      </div>
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg p-4">
        <p className="text-sm text-slate-400">Semantic Fit</p>
        <p className="text-3xl font-bold">{result.scores.semantic_fit_percent}%</p>
      </div>
      <div className="bg-cyan-500/80 backdrop-blur-md border border-cyan-400/50 text-white p-4 rounded-xl shadow-lg">
        <p className="text-sm">Final Score / Verdict</p>
        <p className="text-3xl font-bold">{result.scores.final_relevance_score}% ({result.scores.verdict})</p>
      </div>
    </div>
    <div className="mt-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h3 className="font-semibold text-slate-300 mb-2">Required Skills (from JD)</h3>
        <div className="flex flex-wrap gap-2">
          {result.identified_skills.map(skill => <span key={skill} className="bg-slate-700 text-xs font-medium px-2.5 py-1 rounded-full">{skill}</span>)}
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-slate-300 mb-2">Found Skills (in Resume)</h3>
        <div className="flex flex-wrap gap-2">
          {result.found_skills_in_resume.length > 0 ?
            result.found_skills_in_resume.map(skill => <span key={skill} className="bg-green-800 text-xs font-medium px-2.5 py-1 rounded-full">{skill}</span>) :
            <p className="text-slate-500 text-sm">No direct matches found.</p>
          }
        </div>
      </div>
    </div>
    <button onClick={onReset} className="w-full mt-6 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg backdrop-blur-sm transition-colors">Analyze Another</button>
  </motion.div>
);


const BulkResultsDisplay = ({ results, onReset }) => (
    <motion.div key="bulk-result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.7 }}>
        <h3 className="text-3xl font-bold text-cyan-400 mb-6">Bulk Analysis Results</h3>
        <div className="overflow-x-auto bg-black/20 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg p-6">
            <table className="w-full text-left table-auto">
                <thead>
                    <tr className="border-b border-slate-600">
                        <th className="p-3 font-semibold">Rank</th>
                        <th className="p-3 font-semibold">Resume</th>
                        <th className="p-3 font-semibold">Final Score</th>
                        <th className="p-3 font-semibold">Verdict</th>
                    </tr>
                </thead>
                <tbody>
                    {results.length > 0 ? results.map((result, index) => (
                        <tr key={index} className="border-b border-slate-700/50 hover:bg-slate-500/10">
                            <td className="p-3 text-slate-300">{index + 1}</td>
                            <td className="p-3 text-white truncate">{result.resume_filename}</td>
                            <td className="p-3 font-mono text-cyan-300">
                                {parseFloat(result.final_score).toFixed(2)}%
                            </td>
                            <td className="p-3"><span className="px-2 py-1 text-xs font-semibold bg-cyan-500/30 text-cyan-300 rounded-full">{result.verdict || 'N/A'}</span></td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan="4" className="text-center p-4 text-slate-400">No matches found.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
        <button onClick={onReset} className="w-full mt-6 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg backdrop-blur-sm transition-colors">Run Another Analysis</button>
    </motion.div>
);

const AnalyzerPage = () => {
    const [jdFile, setJdFile] = useState(null);
    const [resumeFiles, setResumeFiles] = useState([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [results, setResults] = useState(null);
    const [isBulk, setIsBulk] = useState(false);

    const handleAnalyze = async () => {
        if (!jdFile || resumeFiles.length === 0) return;
        setIsAnalyzing(true);
        setResults(null);

        const formData = new FormData();
        formData.append('jd_file', jdFile);

        try {
            if (isBulk) {
                resumeFiles.forEach(file => {
                    formData.append('resume_files', file);
                });
                const response = await axios.post(`${API_BASE_URL}/analyze-bulk/`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                setResults(response.data.results);
            } else {
                formData.append('resume_file', resumeFiles[0]);
                const response = await axios.post(`${API_BASE_URL}/evaluate/`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                setResults(response.data);
            }
        } catch (error) {
            console.error("Analysis failed:", error);
            alert("Analysis failed. Check console for details.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleReset = () => {
        setJdFile(null);
        setResumeFiles([]);
        setResults(null);
    };

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="bg-black/20 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg p-6 md:p-8 space-y-8">
            <AnimatePresence mode="wait">
                {!results ? (
                    <motion.div key="analyzer-form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}>
                        <h3 className="text-3xl font-bold text-cyan-400 mb-6">Resume Analyzer</h3>
                        <div className="flex items-center space-x-4 mb-4">
                            <button
                                onClick={() => {
                                    setIsBulk(false);
                                    handleReset();
                                }}
                                className={`py-2 px-4 rounded-lg font-semibold ${!isBulk ? 'bg-purple-600' : 'bg-slate-700/50'}`}
                            >
                                Single Analysis
                            </button>
                            <button
                                onClick={() => {
                                    setIsBulk(true);
                                    handleReset();
                                }}
                                className={`py-2 px-4 rounded-lg font-semibold ${isBulk ? 'bg-purple-600' : 'bg-slate-700/50'}`}
                            >
                                Bulk Analysis
                            </button>
                        </div>
        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-black/20 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg p-6">
                            <FileInput onFileSelect={(files) => setJdFile(files[0])} files={jdFile ? [jdFile] : []} title="Upload Job Description" multiple={false} />
                            <FileInput onFileSelect={(files) => setResumeFiles(Array.from(files))} files={resumeFiles} title="Upload Resume(s)" multiple={isBulk} />
                        </div>
                        <div className="mt-6">
                            <button
                                onClick={handleAnalyze}
                                disabled={isAnalyzing || !jdFile || resumeFiles.length === 0}
                                className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 rounded-lg font-bold text-lg disabled:bg-slate-500/50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center"
                            >
                                {isAnalyzing ? <><LoadingSpinner /> Analyzing...</> : `Analyze ${resumeFiles.length} Resume${resumeFiles.length > 1 ? 's' : ''}`}
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    isBulk ? (
                        <BulkResultsDisplay results={results} onReset={handleReset} />
                    ) : (
                        <SingleResultDisplay result={results} onReset={handleReset} />
                    )
                )}
            </AnimatePresence>
        </div>
      </motion.div>
    );
};

export default AnalyzerPage;