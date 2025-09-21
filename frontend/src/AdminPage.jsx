// frontend/src/AdminPage.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const API_BASE_URL = 'http://127.0.0.1:8000';

const LoadingSpinner = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

// --- Reusable Components ---
const StatCard = ({ title, value, icon }) => (
  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 flex items-center gap-4">
    <div className="bg-cyan-500/20 p-3 rounded-lg">{icon}</div>
    <div>
      <p className="text-slate-400 text-sm">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  </div>
);

const UsersIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-cyan-300"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-4.663M12 12.375a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" /></svg> );
const AnalysesIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-cyan-300"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 100 15 7.5 7.5 0 000-15zM21 21l-5.197-5.197" /></svg> );
const IndexedIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-cyan-300"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" /></svg> );
const DeleteIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.067-2.09.921-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg> );

// --- Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

// --- Main Admin Page Component ---
const AdminPage = ({ username, token }) => {
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [pageIsLoading, setPageIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // For Detailed Analysis History
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // For Add User functionality
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [registrationMessage, setRegistrationMessage] = useState({ text: '', type: '' });
  const [isRegistering, setIsRegistering] = useState(false);

  // Fetch analytics, users, resumes, and jobs
  const fetchData = async () => {
    setFetchError(null);
    setPageIsLoading(true);
    try {
      const [analyticsRes, usersRes, resumesRes, jobsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/analytics/`),
        axios.get(`${API_BASE_URL}/users/`),
        axios.get(`${API_BASE_URL}/resumes/`),
        axios.get(`${API_BASE_URL}/jobs/`)
      ]);
      setAnalytics(analyticsRes.data);
      setUsers(usersRes.data);
      setResumes(resumesRes.data.resumes);
      setJobs(jobsRes.data);
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
      setFetchError("Failed to load admin data. Please try logging in again.");
    } finally {
      setPageIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
        fetchData();
    }
  }, [token]);

  // Fetch results when a job is selected
  useEffect(() => {
    const fetchResults = async () => {
      if (!selectedJob) return;
      setIsLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/results/${selectedJob}`);
        setResults(res.data);
      } catch (error) {
        console.error("Failed to fetch results:", error);
        setResults([]);
      }
      setIsLoading(false);
    };
    fetchResults();
  }, [selectedJob]);

  const handleDeleteUser = async (username) => {
    if (window.confirm(`Are you sure you want to delete user: ${username}?`)) {
      try {
        await axios.delete(`${API_BASE_URL}/users/${username}`);
        fetchData();
      } catch (error) {
        alert(`Failed to delete user: ${error.response?.data?.detail || 'Unknown error'}`);
      }
    }
  };

  const handleDeleteResume = async (filename) => {
    if (window.confirm(`Are you sure you want to delete resume: ${filename}?`)) {
      try {
        await axios.delete(`${API_BASE_URL}/resumes/${filename}`);
        fetchData();
      } catch (error) {
        alert("Failed to delete resume.");
      }
    }
  };
  
  const handleClearJobHistory = async (jobDescription) => {
    if (window.confirm(`Are you sure you want to delete all history for '${jobDescription}'? This action cannot be undone.`)) {
      try {
        await axios.delete(`${API_BASE_URL}/history/clear/${jobDescription}`);
        alert(`History for '${jobDescription}' has been deleted.`);
        fetchData();
      } catch (error) {
        alert(`Failed to delete history: ${error.response?.data?.detail || 'Unknown error'}`);
      }
    }
  };
  
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegistrationMessage({ text: '', type: '' });
    setIsRegistering(true);

    if (!newUsername || !newPassword) {
      setRegistrationMessage({ text: 'Username and password cannot be empty.', type: 'error' });
      setIsRegistering(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/register/`, {
        username: newUsername,
        password: newPassword,
      });
      setRegistrationMessage({ text: response.data.message, type: 'success' });
      setNewUsername('');
      setNewPassword('');
      fetchData();
    } catch (error) {
      setRegistrationMessage({ text: error.response?.data?.detail || 'Registration failed.', type: 'error' });
    } finally {
      setIsRegistering(false);
    }
  };

  if (pageIsLoading) {
    return (
      <div className="flex justify-center items-center min-h-[500px]">
        <LoadingSpinner />
        <span className="ml-2 text-slate-400">Loading admin data...</span>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="text-center p-8 bg-red-900/50 rounded-lg">
        <p className="text-red-400 font-bold text-lg">{fetchError}</p>
        <p className="mt-2 text-red-300">Make sure you are logged in and the backend server is running.</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="bg-black/20 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg p-6 md:p-8 space-y-8">
        
        <div>
          <h2 className="text-3xl font-bold text-cyan-400 mb-6">Admin Dashboard</h2>
          {username && <p className="text-sm text-slate-400 -mt-4 mb-4">Logged in as: <span className="font-semibold text-white">{username}</span></p>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {analytics ? (
              <>
                <StatCard title="Total Analyses" value={analytics.total_analyses} icon={<AnalysesIcon />} />
                <StatCard title="Indexed Resumes" value={analytics.total_indexed_resumes} icon={<IndexedIcon />} />
                <StatCard title="Registered Users" value={analytics.total_users} icon={<UsersIcon />} />
              </>
            ) : <p>Loading analytics...</p>}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 border-t border-slate-700 pt-8">
          <div>
            <h3 className="text-2xl font-bold text-slate-300 mb-4">User Management</h3>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
              <h4 className="text-xl font-bold text-teal-300 mb-4">Add New User</h4>
              <form onSubmit={handleRegister} className="space-y-4">
                <input
                  type="text"
                  placeholder="Username"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full p-2 bg-slate-700 rounded-md text-white placeholder-slate-400"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2 bg-slate-700 rounded-md text-white placeholder-slate-400"
                />
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="w-full py-2 bg-teal-600 hover:bg-teal-700 rounded-lg font-semibold disabled:bg-slate-500 transition-colors"
                >
                  {isRegistering ? 'Adding...' : 'Add User'}
                </button>
              </form>
              {registrationMessage.text && (
                <p className={`mt-4 text-center ${registrationMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                  {registrationMessage.text}
                </p>
              )}
            </div>
            
            <div className="bg-slate-800/50 p-4 rounded-lg max-h-96 overflow-y-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-slate-800/80 backdrop-blur-sm">
                  <tr><th className="p-2">Username</th><th className="p-2">Actions</th></tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-t border-slate-700">
                      <td className="p-2">{user.username}</td>
                      <td className="p-2">
                        <button onClick={() => handleDeleteUser(user.username)} className="text-red-400 hover:text-red-300"><DeleteIcon /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-slate-300 mb-4">Resume Vector Store</h3>
            <div className="bg-slate-800/50 p-4 rounded-lg max-h-96 overflow-y-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-slate-800/80 backdrop-blur-sm">
                  <tr><th className="p-2">Filename</th><th className="p-2">Actions</th></tr>
                </thead>
                <tbody>
                  {resumes.map(filename => (
                    <tr key={filename} className="border-t border-slate-700">
                      <td className="p-2 truncate" title={filename}>{filename}</td>
                      <td className="p-2">
                        <button onClick={() => handleDeleteResume(filename)} className="text-red-400 hover:text-red-300"><DeleteIcon /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-700 pt-8">
          <h3 className="text-xl font-bold text-slate-300 mb-4">Detailed Analysis History</h3>
          <div className="flex items-center gap-4 mb-4">
            <select 
              value={selectedJob} 
              onChange={(e) => setSelectedJob(e.target.value)}
              className="w-full p-3 rounded-lg bg-slate-800/50 border border-slate-600 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            >
              <option value="">-- Select a Job to See Full Analysis --</option>
              {jobs.map((job, index) => (
                <option key={index} value={job}>{job}</option>
              ))}
            </select>
            <button onClick={() => handleClearJobHistory(selectedJob)} disabled={!selectedJob} className="text-sm px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold disabled:bg-slate-500 disabled:cursor-not-allowed">
                Clear History for Job
            </button>
          </div>
          

          {isLoading ? (<p>Loading...</p>) : selectedJob && (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="overflow-x-auto">
              <table className="w-full text-left">
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
                    <motion.tr key={result.id} variants={itemVariants} className="border-b border-slate-700/50 hover:bg-slate-500/10">
                      <td className="p-3 text-slate-300">{index + 1}</td>
                      <td className="p-3 text-white">{result.resume_filename}</td>
                      <td className="p-3 font-mono text-cyan-300">{result.final_score.toFixed(2)}</td>
                      <td className="p-3"><span className="px-2 py-1 text-xs font-semibold bg-cyan-500/30 text-cyan-300 rounded-full">{result.verdict}</span></td>
                    </motion.tr>
                  )) : <tr><td colSpan="4" className="text-center p-4 text-slate-400">No results found for this job.</td></tr>}
                </tbody>
              </table>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AdminPage;