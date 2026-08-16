// AdminRAGEngine.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_URL from '../../config';
import {
  ArrowLeft, Upload, FileText, Search, Zap, Database,
  MessageSquare, Send, Plus, X, Trash2, Edit,
  BookOpen, Brain, Sparkles, Wand2, FolderOpen,
  File, CheckCircle, Clock, AlertCircle, RefreshCw,
  Download, BarChart3, TrendingUp, Users, Globe
} from 'lucide-react';

const AdminRAGEngine = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [conversation, setConversation] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [documentStats, setDocumentStats] = useState({
    total: 0,
    processed: 0,
    pending: 0,
    failed: 0,
    totalChunks: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [ragStatus, setRagStatus] = useState(null);

  // Load documents on mount
  useEffect(() => {
    fetchDocuments();
    checkRagStatus();
  }, []);

  const checkRagStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/admin/rag/health`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRagStatus(response.data);
      console.log('RAG Status:', response.data);
    } catch (error) {
      console.error('Failed to check RAG status:', error);
    }
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      console.log('📚 Fetching documents...');
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/admin/rag/documents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('📚 Document response:', response.data);
      
      if (response.data.success) {
        const docs = response.data.documents || [];
        setDocuments(docs);
        setDocumentStats({
          total: docs.length,
          processed: docs.filter(d => d.status === 'processed').length,
          pending: docs.filter(d => d.status === 'pending').length,
          failed: docs.filter(d => d.status === 'failed').length,
          totalChunks: docs.reduce((sum, d) => sum + (d.chunks || 0), 0)
        });
        console.log(`📚 Loaded ${docs.length} documents`);
      } else {
        console.warn('📚 No documents found or error:', response.data);
        setDocuments([]);
        setDocumentStats({
          total: 0,
          processed: 0,
          pending: 0,
          failed: 0,
          totalChunks: 0
        });
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      // Don't show toast for 404 - it means no documents yet
      if (error.response?.status !== 404) {
        toast.error('Failed to load documents');
      }
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setUploadedFiles(files);
    setUploadProgress(0);
    setProcessing(true);
    
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      files.forEach(file => {
        formData.append('documents', file);
      });
      
      console.log('📤 Uploading files:', files.map(f => f.name));
      
      const response = await axios.post(`${API_URL}/api/admin/rag/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      });
      
      console.log('📤 Upload response:', response.data);
      
      if (response.data.success) {
        const { processed, failed, results, errors } = response.data;
        
        if (processed > 0) {
          toast.success(`Uploaded ${processed} document(s) successfully!`);
        }
        
        if (failed > 0) {
          const fileErrors = errors || [];
          if (fileErrors.length > 0) {
            fileErrors.forEach(e => toast.error(`${e.name}: ${e.error}`, { duration: 8000 }));
          } else {
            toast.error(`${failed} document(s) failed to upload.`);
          }
        }
        
        setShowUploadModal(false);
        setUploadedFiles([]);
        // Refresh documents immediately
        await fetchDocuments();
        // Refresh stats
        await checkRagStatus();
        
        if (results && results.length > 0) {
          console.log('📊 Upload results:', results);
        }
      } else {
        toast.error(response.data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      console.error('Error response:', error.response?.data);
      
      // Show more specific error message
      if (error.response?.data?.details) {
        const details = error.response.data.details;
        let errorMsg = 'Upload failed: ';
        if (details.openaiKey === 'Missing') {
          errorMsg += 'OpenAI API key is missing. Please check your .env file.';
        } else if (details.pineconeKey === 'Missing') {
          errorMsg += 'Pinecone API key is missing. Please check your .env file.';
        } else if (details.pineconeIndex === 'Not set') {
          errorMsg += 'Pinecone index is not set. Please check your .env file.';
        } else {
          errorMsg += error.response.data.message || 'Unknown error';
        }
        toast.error(errorMsg);
      } else {
        toast.error(error.response?.data?.message || error.response?.data?.error || 'Failed to upload documents');
      }
    } finally {
      setProcessing(false);
      setUploadProgress(0);
    }
  };

  const askQuestion = async () => {
    if (!query.trim()) {
      toast.error('Please enter a question');
      return;
    }

    setIsProcessing(true);
    setResponse('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/admin/rag/query`, {
        question: query,
        documentId: selectedDoc?.id || null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setResponse(response.data.answer);
        setConversation(prev => [
          ...prev,
          { 
            id: Date.now(),
            question: query, 
            answer: response.data.answer,
            timestamp: new Date().toISOString(),
            sources: response.data.sources || []
          }
        ]);
        setQuery('');
        if (response.data.sources?.length) {
          toast.success('Answer generated!');
        } else {
          toast('No matching document content found for that question.', { icon: 'ℹ️' });
        }
      } else {
        toast.error(response.data.message || 'Failed to get answer');
      }
    } catch (error) {
      console.error('Query error:', error);
      const message = error.response?.data?.message || error.response?.data?.error || 'Failed to get answer';
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteDocument = async (docId) => {
    if (!window.confirm('Delete this document and all its embeddings?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/admin/rag/documents/${docId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Document deleted');
      await fetchDocuments();
      if (selectedDoc?.id === docId) setSelectedDoc(null);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete document');
    }
  };

  const reindexDocument = async (docId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/admin/rag/reindex/${docId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Reindexing started');
      await fetchDocuments();
    } catch (error) {
      console.error('Reindex error:', error);
      toast.error('Failed to reindex document');
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'processed': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'failed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'processed': return <CheckCircle size={16} className="text-green-600" />;
      case 'pending': return <Clock size={16} className="text-yellow-600" />;
      case 'failed': return <AlertCircle size={16} className="text-red-600" />;
      default: return <File size={16} className="text-gray-600" />;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || doc.type === filterType;
    return matchesSearch && matchesType;
  });

  // Document Type Stats
  const typeStats = documents.reduce((acc, doc) => {
    acc[doc.type] = (acc[doc.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50/30">
      
      {/* Header */}
      <header className="bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-600 shadow-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/admin-dashboard')}
                className="p-2 hover:bg-white/20 rounded-xl transition-all text-white"
              >
                <ArrowLeft size={24} />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Brain size={22} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-white">RAG Intelligence</h1>
                  <p className="text-xs text-cyan-200 font-medium">Retrieval-Augmented Generation Engine</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-cyan-400 to-teal-400 text-teal-900 rounded-xl font-bold hover:shadow-lg transition flex items-center gap-2"
              >
                <Upload size={18} />
                Upload Documents
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Status Alert */}
        {ragStatus && !ragStatus.services?.openai && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-800">RAG Service Not Configured</h4>
                <p className="text-sm text-yellow-700">
                  OpenAI is not configured. Please add OPENAI_API_KEY to your .env file.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {ragStatus && !ragStatus.services?.pinecone && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-800">Pinecone Not Configured</h4>
                <p className="text-sm text-yellow-700">
                  Pinecone is not configured. Please add PINECONE_API_KEY and PINECONE_INDEX to your .env file.
                </p>
              </div>
            </div>
          </div>
        )}

        {ragStatus?.message?.length > 0 && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-800">AI Intelligence Setup Required</h4>
                <ul className="text-sm text-amber-700 mt-1 list-disc list-inside space-y-1">
                  {ragStatus.message.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-teal-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-teal-500 font-bold uppercase tracking-wider">Total Documents</p>
                <p className="text-2xl font-black text-teal-800 mt-1">{documentStats.total}</p>
              </div>
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                <FileText size={24} className="text-teal-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-green-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-500 font-bold uppercase tracking-wider">Processed</p>
                <p className="text-2xl font-black text-green-800 mt-1">{documentStats.processed}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle size={24} className="text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-purple-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-500 font-bold uppercase tracking-wider">Total Chunks</p>
                <p className="text-2xl font-black text-purple-800 mt-1">{documentStats.totalChunks}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Database size={24} className="text-purple-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-amber-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-500 font-bold uppercase tracking-wider">Conversations</p>
                <p className="text-2xl font-black text-amber-800 mt-1">{conversation.length}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <MessageSquare size={24} className="text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-[1fr_380px] gap-6">
          
          {/* Left: Q&A Interface */}
          <div className="space-y-6">
            {/* Chat Interface */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-cyan-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
                      <MessageSquare size={18} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">Ask AI Assistant</h3>
                      <p className="text-xs text-gray-500">Get answers from your documents</p>
                    </div>
                  </div>
                  {selectedDoc && (
                    <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full">
                      📄 {selectedDoc.name}
                    </span>
                  )}
                </div>
              </div>

              {/* Conversation History */}
              <div className="h-[400px] overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                {conversation.length === 0 ? (
                  <div className="text-center py-12">
                    <Brain size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">Start a conversation with your documents</p>
                    <p className="text-xs text-gray-400 mt-1">Ask questions about your uploaded content</p>
                  </div>
                ) : (
                  conversation.map((item) => (
                    <div key={item.id} className="space-y-3">
                      {/* User Question */}
                      <div className="flex justify-end">
                        <div className="bg-teal-600 text-white rounded-xl px-4 py-3 max-w-[80%]">
                          <p className="text-sm">{item.question}</p>
                          <p className="text-[10px] text-teal-200 mt-1">{formatDate(item.timestamp)}</p>
                        </div>
                      </div>
                      {/* AI Answer */}
                      <div className="flex justify-start">
                        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 max-w-[85%] shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles size={14} className="text-purple-500" />
                            <span className="text-xs font-semibold text-purple-600">AI Response</span>
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.answer}</p>
                          {item.sources && item.sources.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <p className="text-[10px] text-gray-400 font-medium">Sources:</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {item.sources.map((source, idx) => (
                                  <span key={idx} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                    {source}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          <p className="text-[10px] text-gray-400 mt-2">{formatDate(item.timestamp)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                        <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse delay-100"></div>
                        <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse delay-200"></div>
                        <span className="text-sm text-gray-500 ml-2">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && askQuestion()}
                    placeholder="Ask a question about your documents..."
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
                    disabled={isProcessing}
                  />
                  <button
                    onClick={askQuestion}
                    disabled={isProcessing || !query.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Send size={18} />
                    Ask
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-2">
                  💡 Ask questions about your uploaded documents. AI will find relevant information.
                </p>
              </div>
            </div>
          </div>

          {/* Right: Document Management */}
          <div className="space-y-6">
            {/* Document List */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database size={18} className="text-teal-600" />
                    <h3 className="font-bold text-gray-800">Document Library</h3>
                    <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
                      {documents.length}
                    </span>
                  </div>
                  <button
                    onClick={fetchDocuments}
                    className="p-1.5 hover:bg-gray-200 rounded-lg transition"
                    title="Refresh"
                  >
                    <RefreshCw size={16} className="text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="p-3 border-b border-gray-100 flex gap-2">
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
                />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all bg-white"
                >
                  <option value="all">All Types</option>
                  {Object.keys(typeStats).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Document List */}
              <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-100">
                {loading ? (
                  <div className="p-8 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-500 border-t-transparent mx-auto"></div>
                    <p className="mt-2 text-sm">Loading documents...</p>
                  </div>
                ) : filteredDocuments.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <FileText size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-sm">No documents found</p>
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="mt-2 text-sm text-teal-600 hover:text-teal-700 font-medium"
                    >
                      Upload your first document →
                    </button>
                  </div>
                ) : (
                  filteredDocuments.map((doc) => (
                    <div 
                      key={doc.id}
                      className={`p-3 hover:bg-gray-50 transition cursor-pointer ${
                        selectedDoc?.id === doc.id ? 'bg-teal-50 border-l-4 border-teal-500' : ''
                      }`}
                      onClick={() => setSelectedDoc(doc)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <FileText size={18} className="text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium text-gray-800 text-sm truncate">{doc.name}</p>
                              <p className="text-xs text-gray-400">{doc.type || 'Unknown'} • {doc.chunks || 0} chunks</p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${getStatusColor(doc.status)} flex items-center gap-1`}>
                                {getStatusIcon(doc.status)}
                                {doc.status || 'pending'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[10px] text-gray-400">📅 {formatDate(doc.created_at)}</span>
                            <span className="text-[10px] text-gray-400">📊 {doc.word_count || 0} words</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1.5">
                            <button
                              onClick={(e) => { e.stopPropagation(); reindexDocument(doc.id); }}
                              className="text-[10px] text-blue-600 hover:text-blue-700"
                              title="Reindex"
                            >
                              <RefreshCw size={12} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteDocument(doc.id); }}
                              className="text-[10px] text-red-600 hover:text-red-700"
                              title="Delete"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Document Types</h4>
              <div className="space-y-2">
                {Object.entries(typeStats).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{type || 'Unknown'}</span>
                    <span className="text-sm font-bold text-gray-800">{count}</span>
                  </div>
                ))}
                {Object.keys(typeStats).length === 0 && (
                  <p className="text-sm text-gray-400">No documents uploaded yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => { setShowUploadModal(false); setUploadedFiles([]); setUploadProgress(0); }}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md">
                  <Upload size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Upload Documents</h2>
                  <p className="text-sm text-gray-500">Upload files for the AI to analyze</p>
                </div>
              </div>
              <button onClick={() => { setShowUploadModal(false); setUploadedFiles([]); setUploadProgress(0); }} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              <div 
                className="border-2 border-solid border-gray-200 rounded-xl p-8 text-center hover:border-teal-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,.docx,.txt,.md,.csv,.json"
                  onChange={handleFileUpload}
                  multiple
                  className="hidden"
                />
                <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-sm text-gray-600 font-medium">Click to select files or drag and drop</p>
                <p className="text-xs text-gray-400 mt-1">Supports PDF, DOCX, TXT, MD, CSV, JSON</p>
                {uploadedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {uploadedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded-lg">
                        <span className="text-gray-700">{file.name}</span>
                        <span className="text-gray-400">{(file.size / 1024).toFixed(1)} KB</span>
                      </div>
                    ))}
                  </div>
                )}
                {uploadProgress > 0 && (
                  <div className="mt-4">
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{uploadProgress}% uploaded</p>
                  </div>
                )}
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2">
                  <Brain size={16} className="text-blue-600" />
                  <p className="text-xs text-blue-700">
                    Documents will be processed and indexed for AI-powered search and Q&A
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setShowUploadModal(false); setUploadedFiles([]); setUploadProgress(0); }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={processing}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl font-medium hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {processing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      Select Files
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRAGEngine;