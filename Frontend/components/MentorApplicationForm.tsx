import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Link as LinkIcon, GraduationCap, Mail, User, BookOpen } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import learningPaths from "../data/learningPath.json";

interface MentorApplicationFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const MentorApplicationForm: React.FC<MentorApplicationFormProps> = ({
  isOpen,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    educationalQualification: "",
    streamOfMentoring: "",
    certificateUrl: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [availableStreams, setAvailableStreams] = useState<string[]>([]);

  useEffect(() => {
    const streams = (learningPaths as { topic: string }[]).map((path) => path.topic);
    setAvailableStreams(streams);
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.from("mentor_applications").insert([
        {
          full_name: formData.fullName,
          email: formData.email,
          educational_qualification: formData.educationalQualification,
          stream_of_mentoring: formData.streamOfMentoring,
          certificate_url: formData.certificateUrl.trim() || null,
          status: "pending",
        },
      ]).select();

      if (error) {
        console.error("Submission error:", error);
        console.error("Error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        
        // More specific error messages
        if (error.code === "42P01") {
          alert("Database table not found. Please ensure the mentor_applications table exists.");
        } else if (error.code === "42501") {
          alert("Permission denied. Please check database permissions.");
        } else {
          alert(`Failed to submit application: ${error.message || "Please try again."}`);
        }
        setIsSubmitting(false);
        return;
      }

      // Success - show success message
      if (data && data.length > 0) {
        console.log("Application submitted successfully:", data[0]);
        setIsSubmitting(false);
        setIsSubmitted(true);
        
        // Reset form after showing success message (4 seconds)
        setTimeout(() => {
          setIsSubmitted(false);
          setFormData({
            fullName: "",
            email: "",
            educationalQualification: "",
            streamOfMentoring: "",
            certificateUrl: "",
          });
          onClose();
        }, 4000);
      } else {
        // Even if no data returned, if no error, consider it success
        console.log("Application submitted (no data returned but no error)");
        setIsSubmitting(false);
        setIsSubmitted(true);
        
        setTimeout(() => {
          setIsSubmitted(false);
          setFormData({
            fullName: "",
            email: "",
            educationalQualification: "",
            streamOfMentoring: "",
            certificateUrl: "",
          });
          onClose();
        }, 4000);
      }
    } catch (err: any) {
      console.error("Unexpected error:", err);
      alert(`Something went wrong: ${err?.message || "Please try again."}`);
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        fullName: "",
        email: "",
        educationalQualification: "",
        streamOfMentoring: "",
        certificateUrl: "",
      });
      setIsSubmitted(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-zinc-900 border border-white/10 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-zinc-900 z-10">
            <h2 className="text-2xl font-bold text-white">Become a Mentor</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isSubmitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-12 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6"
              >
                <svg
                  className="w-10 h-10 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </motion.div>
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-white mb-4"
              >
                Thank you for applying!
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-gray-400 text-lg"
              >
                We will get back to you through mail after verification.
              </motion.p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  Educational Qualification
                </label>
                <select
                  name="educationalQualification"
                  value={formData.educationalQualification}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent [&_option]:bg-zinc-800"
                  style={{ colorScheme: "dark" }}
                >
                  <option value="">Select qualification</option>
                  <option value="Bachelor's Degree">Bachelor's Degree</option>
                  <option value="Master's Degree">Master's Degree</option>
                  <option value="PhD">PhD</option>
                  <option value="Professional Certification">Professional Certification</option>
                  <option value="Industry Experience">Industry Experience</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Stream of Mentoring
                </label>
                <select
                  name="streamOfMentoring"
                  value={formData.streamOfMentoring}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent [&_option]:bg-zinc-800"
                  style={{ colorScheme: "dark" }}
                >
                  <option value="">Select a stream</option>
                  {availableStreams.map((stream) => (
                    <option key={stream} value={stream}>
                      {stream}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  Certificate URL (Link to any certificates you have completed in this stream)
                </label>
                <input
                  type="url"
                  name="certificateUrl"
                  value={formData.certificateUrl}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="https://example.com/certificate.pdf or https://example.com/certificate.jpg"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Provide a link to any certificates, credentials, or proof of expertise you have in this stream (e.g., Google Drive, Dropbox, LinkedIn certificate, or any public URL)
                </p>
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MentorApplicationForm;
