// Vercel serverless function handler
export default async function handler(req, res) {
  try {
    // Import the clean serverless version (no Vite dependencies)
    const { initializeServer } = await import('../dist/serverless.js');
    const app = await initializeServer();
    
    // Use the Express app as handler
    return app(req, res);
  } catch (error) {
    console.error('Function handler error:', error);
    return res.status(500).json({ 
      error: 'Server startup failed', 
      message: error.message,
      stack: error.stack 
    });
  }
}