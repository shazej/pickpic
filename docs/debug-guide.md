# How to Debug Common Issues in PickPic

## AI Search Failures
- **Symptom**: Search results are empty or "Searching..." hangs.
- **Check**:
    - Verify `GEMINI_API_KEY` in `.env`.
    - Check server logs for Genkit errors.
    - Ensure image/audio/video files are being uploaded correctly to the `temp` directory.

## Listing Creation Issues
- **Symptom**: "Create Listing" button does nothing or returns error.
- **Check**:
    - Verify database connection (`DATABASE_URL`).
    - Check browser console for validation errors (Zod).
    - Ensure AI analysis completed before submission.

## I18n Issues (Arabic/RTL)
- **Symptom**: Layout looks broken in Arabic.
- **Check**:
    - Ensure `dir="rtl"` is set on `<html>` tag (via `LanguageContext`).
    - Use `start` and `end` instead of `left` and `right` in Tailwind (e.g., `ps-4`, `me-2`).

## Authentication Problems
- **Symptom**: Redirected to login unexpectedly.
- **Check**:
    - Check session cookie in browser.
    - Verify `JWT_SECRET` is consistent across restarts.
