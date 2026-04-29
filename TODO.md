# Design & UX Improvements TODO

## Tasks
- [x] 1. Create `MedicalChatbotIcon.jsx` — 3D CSS/SVG medical chatbot icon with floating animation
- [x] 2. Update `ChatPage.jsx` — Redesign WelcomeScreen with 3D icon centered, improve responsive layout
- [x] 3. Update `MessageComponents.jsx` — Better responsive widths, improved loading animation with 3D icon
- [x] 4. Update `Sidebar.jsx` — Better mobile drawer, improved touch targets, 3D icon in header
- [x] 5. Update `App.jsx` — Improve mobile overlay (AnimatePresence) and responsive padding
- [x] 6. Update `index.css` — Add 3D icon animations, responsive utilities, floating effects, glass morphism
- [x] 7. Test build and verify no errors
- [x] 8. Fix missing `/audio/transcribe` backend endpoint
- [x] 9. Fix missing `/doctors/detect-specialty` backend endpoint
- [x] 10. Fix Groq tool_use_failed error — added fallback LLM mechanism
- [x] 11. Fix geolocation "Position indisponible" — added IP fallback + manual city input
- [x] 12. Remove capabilities grid & example queries from WelcomeScreen
- [x] 13. Clean up unused imports/constants in ChatPage.jsx
- [x] 14. Fix PDF upload — added missing `size_bytes` to UploadResponse
- [x] 15. Fix PDF content not used by agent — added `_extract_text_from_uploaded_files` + wired `file_ids` through orchestrator
