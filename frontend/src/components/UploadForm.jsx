import React, { useState, useRef, useCallback, useEffect } from 'react'
import { createReport, reverseGeocode } from '../api'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, Image, MapPin, AlertCircle, CheckCircle, Loader2, Trash2, Camera, MapPin as MapPinIcon, Info, Tag, Box, MapPinned } from 'lucide-react'

const CATEGORY_OPTIONS = [
  'Household waste',
  'Plastic & packaging',
  'Organic / food waste',
  'Construction & debris',
  'Hazardous waste',
  'E-waste',
  'Mixed / unknown',
]

const VOLUME_OPTIONS = [
  'Small (1 bag)',
  'Medium (a few bags)',
  'Large (half truck)',
  'Very large (full truck)',
  'Unknown',
]

const MAX_FILES = 5
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']

const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const validateFile = (file) => {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return `Unsupported file type: ${file.type}. Please use JPEG, PNG, WebP, or HEIC.`
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File too large: ${formatFileSize(file.size)}. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}.`
  }
  return null
}

const FilePreview = ({ fileObj, onRemove, index }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9, y: 10 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.9, y: -10 }}
    className="relative group aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-surface-800"
  >
    <img 
      src={fileObj.preview} 
      alt={fileObj.file.name}
      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
      <span className="text-white text-xs truncate block max-w-full">{fileObj.file.name}</span>
    </div>
    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(fileObj.id) }}
        className="p-2 rounded-full bg-white/90 text-slate-700 hover:bg-white transition-colors shadow-lg"
        aria-label={`Remove ${fileObj.file.name}`}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
    <div className="absolute bottom-2 left-2 text-white text-xs bg-black/50 px-2 py-1 rounded">
      {formatFileSize(fileObj.file.size)}
    </div>
    <div className="absolute top-2 left-2">
      <span className="badge badge-secondary text-xs">{index + 1}</span>
    </div>
  </motion.div>
)

const UploadZone = ({ dragActive, onClick, onKeyDown, onDragEnter, onDragLeave, onDragOver, onDrop, children }) => (
  <button
    type="button"
    className={`upload-zone relative border-2 border-dashed rounded-xl p-6 transition-all cursor-pointer w-full text-left ${
      dragActive 
        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 scale-[1.01] shadow-lg shadow-primary-500/10' 
        : 'border-slate-300 dark:border-surface-700 hover:border-primary-400 hover:bg-slate-50 dark:hover:bg-surface-800/50'
    }`}
    onClick={onClick}
    onKeyDown={onKeyDown}
    onDragEnter={onDragEnter}
    onDragLeave={onDragLeave}
    onDragOver={onDragOver}
    onDrop={onDrop}
    aria-label="Upload photos"
  >
    <div className="flex flex-col items-center justify-center text-center relative z-10">
      <motion.div
        animate={{ scale: dragActive ? 1.1 : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={`p-3 rounded-full transition-colors ${
          dragActive ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' : 'bg-slate-100 text-slate-500 dark:bg-surface-800 dark:text-slate-400'
        }`}
      >
        <Upload className="w-8 h-8" aria-hidden="true" />
      </motion.div>
      <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">
        {dragActive ? 'Drop photos here' : 'Click or drag photos to upload'}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
        JPEG, PNG, WebP, HEIC · Up to {MAX_FILES} files · {formatFileSize(MAX_FILE_SIZE)} each
      </p>
    </div>
    {children}
  </button>
)

const LocationInput = ({ location, onLocationChange, onGetCurrentLocation, landmark, onLandmarkChange, geocoding, disabled }) => (
  <div className="grid gap-4 sm:grid-cols-3">
    <div className="sm:col-span-2">
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
        <MapPinIcon className="w-4 h-4" aria-hidden="true" />
        GPS Coordinates
      </label>
      <div className="flex gap-2">
        <input
          type="number"
          step="any"
          value={location.lat}
          onChange={(e) => onLocationChange({ ...location, lat: e.target.value })}
          placeholder="Latitude (e.g., 12.9716)"
          className="input flex-1"
          aria-label="Latitude"
          disabled={disabled}
        />
        <input
          type="number"
          step="any"
          value={location.lon}
          onChange={(e) => onLocationChange({ ...location, lon: e.target.value })}
          placeholder="Longitude (e.g., 77.5946)"
          className="input flex-1"
          aria-label="Longitude"
          disabled={disabled}
        />
      </div>
    </div>
    <div className="flex items-end">
      <button
        type="button"
        onClick={onGetCurrentLocation}
        className="btn btn-secondary w-full justify-center gap-2"
        disabled={disabled}
      >
        <MapPinIcon className="w-4 h-4" aria-hidden="true" />
        Use my location
      </button>
    </div>
    <div className="sm:col-span-3">
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
        <MapPinned className="w-4 h-4" aria-hidden="true" />
        Landmark / Area name
      </label>
      <div className="relative">
        <input
          type="text"
          value={landmark}
          onChange={(e) => onLandmarkChange(e.target.value)}
          placeholder="e.g., Near MG Road metro station"
          className="input pr-10 w-full"
          aria-label="Landmark or area name"
          disabled={disabled}
        />
        {geocoding && (
          <Loader2 className="w-4 h-4 animate-spin text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
        )}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
        Auto-filled from coordinates — edit freely to name the spot.
      </p>
    </div>
  </div>
)

const ErrorMessage = React.forwardRef(({ error, onDismiss }, ref) => (
  <motion.div
    ref={ref}
    initial={{ opacity: 0, y: -10, height: 0 }}
    animate={{ opacity: 1, y: 0, height: 'auto' }}
    exit={{ opacity: 0, y: -10, height: 0 }}
    className="p-4 rounded-xl bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 flex items-start gap-3"
    role="alert"
  >
    <AlertCircle className="w-5 h-5 text-error-600 dark:text-error-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
    <div className="text-sm text-error-700 dark:text-error-300 whitespace-pre-wrap flex-1">{error}</div>
    <button
      onClick={onDismiss}
      className="p-1 rounded-lg text-error-500 hover:text-error-700 hover:bg-error-100 dark:hover:bg-error-800/50 transition-colors flex-shrink-0"
      aria-label="Dismiss error"
    >
      <X className="w-4 h-4" />
    </button>
  </motion.div>
))

const SuccessMessage = React.forwardRef(({ onDismiss }, ref) => (
  <motion.div
    ref={ref}
    initial={{ opacity: 0, y: -10, height: 0 }}
    animate={{ opacity: 1, y: 0, height: 'auto' }}
    exit={{ opacity: 0, y: -10, height: 0 }}
    className="p-4 rounded-xl bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 flex items-center gap-3"
    role="status"
  >
    <CheckCircle className="w-5 h-5 text-success-600 dark:text-success-400 flex-shrink-0" aria-hidden="true" />
    <div className="text-sm text-success-700 dark:text-success-300">Report submitted successfully!</div>
    <button
      onClick={onDismiss}
      className="p-1 rounded-lg text-success-500 hover:text-success-700 hover:bg-success-100 dark:hover:bg-success-800/50 transition-colors flex-shrink-0"
      aria-label="Dismiss"
    >
      <X className="w-4 h-4" />
    </button>
  </motion.div>
))

export default function UploadForm({ onUploaded }){
  const [files, setFiles] = useState([])
  const [comment, setComment] = useState('')
  const [location, setLocation] = useState({ lat: '', lon: '' })
  const [category, setCategory] = useState('')
  const [volume, setVolume] = useState('')
  const [landmark, setLandmark] = useState('')
  const [geocoding, setGeocoding] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)
  const progressIntervalRef = useRef(null)
  const landmarkTouchedRef = useRef(false)

  const handleFiles = useCallback((newFiles) => {
    const validFiles = []
    const errors = []
    
    Array.from(newFiles).forEach(file => {
      const error = validateFile(file)
      if (error) {
        errors.push(`${file.name}: ${error}`)
      } else if (files.length + validFiles.length < MAX_FILES) {
        validFiles.push({
          file,
          preview: URL.createObjectURL(file),
          id: `${file.name}-${Date.now()}-${Math.random()}`
        })
      } else {
        errors.push(`${file.name}: Maximum ${MAX_FILES} files allowed.`)
      }
    })
    
    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles])
    }
    if (errors.length > 0) {
      setError(errors.join('\n'))
      setTimeout(() => setError(null), 5000)
    }
  }, [files.length])

  const removeFile = (id) => {
    setFiles(prev => {
      const fileObj = prev.find(f => f.id === id)
      if (fileObj) URL.revokeObjectURL(fileObj.preview)
      return prev.filter(f => f.id !== id)
    })
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    } else if (e.type === 'drop') {
      setDragActive(false)
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (files.length === 0) {
      setError('Please add at least one photo.')
      return
    }
    if (!comment.trim()) {
      setError('Please add a description.')
      return
    }
    if (!location.lat || !location.lon) {
      setError('Please provide GPS coordinates.')
      return
    }
    if (!category) {
      setError('Please select a waste category.')
      return
    }
    if (!volume) {
      setError('Please select an estimated volume.')
      return
    }

    setUploading(true)
    setError(null)
    setSuccess(false)
    setProgress(0)

    try {
      const formData = new FormData()
      files.forEach(({ file }) => formData.append('photos', file))
      formData.append('comment', comment)
      formData.append('lat', location.lat)
      formData.append('lon', location.lon)
      if (category) formData.append('category', category)
      if (volume) formData.append('estimated_volume', volume)
      if (landmark) formData.append('landmark', landmark)

      // Simulate progress
      progressIntervalRef.current = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const result = await createReport(formData)
      
      clearInterval(progressIntervalRef.current)
      setProgress(100)
      
      setTimeout(() => {
        setFiles([])
        setComment('')
        setLocation({ lat: '', lon: '' })
        setCategory('')
        setVolume('')
        setLandmark('')
        setGeocoding(false)
        landmarkTouchedRef.current = false
        setProgress(0)
        setUploading(false)
        setSuccess(true)
        onUploaded && onUploaded(result)
      }, 500)
    } catch (err) {
      clearInterval(progressIntervalRef.current)
      setUploading(false)
      setProgress(0)
      setError(err.message || 'Upload failed. Please try again.')
    }
  }

  useEffect(() => {
    const lat = parseFloat(location.lat)
    const lon = parseFloat(location.lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return
    if (landmarkTouchedRef.current) return
    let cancelled = false
    const t = setTimeout(() => {
      setGeocoding(true)
      reverseGeocode(lat, lon).then((name) => {
        if (!cancelled && name) setLandmark(name)
        if (!cancelled) setGeocoding(false)
      })
    }, 500)
    return () => { clearTimeout(t); cancelled = true }
  }, [location.lat, location.lon])

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      return
    }
    setError(null)
    landmarkTouchedRef.current = false
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ 
          lat: pos.coords.latitude.toFixed(6), 
          lon: pos.coords.longitude.toFixed(6) 
        })
      },
      (err) => {
        setError(`Unable to retrieve location: ${err.message}`)
      }
    )
  }

  const handleLandmarkChange = (value) => {
    landmarkTouchedRef.current = true
    setLandmark(value)
  }

  const clearForm = () => {
    files.forEach(f => URL.revokeObjectURL(f.preview))
    setFiles([])
    setComment('')
    setLocation({ lat: '', lon: '' })
    setCategory('')
    setVolume('')
    setLandmark('')
    setGeocoding(false)
    landmarkTouchedRef.current = false
    setError(null)
    setSuccess(false)
    setProgress(0)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      files.forEach(f => URL.revokeObjectURL(f.preview))
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
    }
  }, [])

  return (
    <div className="surface p-6 rounded-2xl border border-slate-200 dark:border-surface-700 animate-in">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
            <Upload className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Submit new report</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Upload photos and details for waste incidents</p>
          </div>
        </div>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-surface-800 dark:hover:text-slate-300 transition-colors"
          aria-label={showHelp ? 'Hide help' : 'Show help'}
          aria-expanded={showHelp}
        >
          <Info className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Help Panel */}
        <AnimatePresence>
          {showHelp && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800"
            >
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="text-sm text-primary-700 dark:text-primary-300 space-y-1">
                  <p><strong>Tips for better reports:</strong></p>
                  <ul className="list-disc list-inside space-y-1 mt-1">
                    <li>Take clear photos showing the waste type and amount</li>
                    <li>Include landmarks or street signs for location context</li>
                    <li>Mention any hazards (chemicals, sharp objects, etc.)</li>
                    <li>Estimate volume (e.g., "2 large bags", "half a truck")</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Photo Upload Zone */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Image className="w-4 h-4" aria-hidden="true" />
            Photos <span className="text-slate-400">(max 5, 10MB each)</span>
          </label>
          
          <UploadZone
            dragActive={dragActive}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click() } }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrag}
          />
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/heic"
            onChange={(e) => handleFiles(e.target.files)}
            className="sr-only"
            aria-label="Upload photos"
          />

          {/* File Previews */}
          <AnimatePresence>
            {files.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-in">
                {files.map((fileObj, index) => (
                  <FilePreview
                    key={fileObj.id}
                    fileObj={fileObj}
                    onRemove={removeFile}
                    index={index}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>
          
          {/* File count indicator */}
          {files.length > 0 && (
            <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
              <span>{files.length} of {MAX_FILES} files selected</span>
              <button
                type="button"
                onClick={clearForm}
                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="comment" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
            <Image className="w-4 h-4" aria-hidden="true" />
            Description
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="textarea"
            placeholder="Describe the waste incident (type, amount, hazards, etc.)"
            aria-describedby="comment-hint"
            disabled={uploading}
          />
          <p id="comment-hint" className="text-xs text-slate-500 dark:text-slate-400 mt-1">Help responders understand the situation.</p>
        </div>

        {/* Category & Volume */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="category" className="label-required block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
              <Tag className="w-4 h-4" aria-hidden="true" />
              Waste category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="select"
              disabled={uploading}
            >
              <option value="">Select category…</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="volume" className="label-required block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
              <Box className="w-4 h-4" aria-hidden="true" />
              Estimated volume
            </label>
            <select
              id="volume"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              className="select"
              disabled={uploading}
            >
              <option value="">Select volume…</option>
              {VOLUME_OPTIONS.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Location */}
        <LocationInput
          location={location}
          onLocationChange={setLocation}
          onGetCurrentLocation={getCurrentLocation}
          landmark={landmark}
          onLandmarkChange={handleLandmarkChange}
          geocoding={geocoding}
          disabled={uploading}
        />

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <ErrorMessage error={error} onDismiss={() => setError(null)} />
          )}
        </AnimatePresence>

        {/* Success Message */}
        <AnimatePresence>
          {success && (
            <SuccessMessage onDismiss={() => setSuccess(false)} />
          )}
        </AnimatePresence>

        {/* Submit Button */}
        <div className="flex flex-col gap-3 sm:flex-row pt-4 border-t border-slate-200 dark:border-surface-700">
          <button
            type="submit"
            className="btn btn-primary flex-1 justify-center gap-2"
            disabled={uploading || files.length === 0 || !comment.trim() || !location.lat || !location.lon || !category || !volume}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                Uploading... {progress}%
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" aria-hidden="true" />
                Submit report
              </>
            )}
          </button>
          <button
            type="button"
            className="btn btn-secondary flex-1 justify-center"
            onClick={clearForm}
            disabled={uploading}
          >
            Clear form
          </button>
        </div>
      </form>
    </div>
  )
}