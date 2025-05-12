// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { OpenAI } from "file:///home/project/node_modules/openai/index.mjs";
import dotenv from "file:///home/project/node_modules/dotenv/lib/main.js";
dotenv.config();
var OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY environment variable");
  process.exit(1);
}
var openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  timeout: 6e4,
  maxRetries: 3
});
var vite_config_default = defineConfig({
  plugins: [
    react(),
    {
      name: "image-analysis-server",
      configureServer(server) {
        server.middlewares.use("/api/analyze-image", async (req, res) => {
          if (req.method === "POST") {
            req.setTimeout(6e4);
            let body = "";
            req.on("data", (chunk) => {
              body += chunk;
            });
            req.on("end", async () => {
              try {
                const { imageUrl } = JSON.parse(body);
                if (!imageUrl || typeof imageUrl !== "string") {
                  throw new Error("Invalid image URL provided");
                }
                const response = await openai.chat.completions.create({
                  model: "gpt-4o-mini",
                  messages: [
                    {
                      role: "user",
                      content: [
                        {
                          type: "text",
                          text: "Describe this found item in JSON format with fields: name (short title), description (characteristics and condition), tags (2-3 keywords)"
                        },
                        {
                          type: "image_url",
                          image_url: {
                            url: imageUrl
                          }
                        }
                      ]
                    }
                  ],
                  max_tokens: 500,
                  response_format: { type: "json_object" }
                });
                const analysis = JSON.parse(response.choices[0].message.content);
                const formattedAnalysis = {
                  name: analysis.name || "",
                  description: analysis.description || "",
                  tags: Array.isArray(analysis.tags) ? analysis.tags : []
                };
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(formattedAnalysis));
              } catch (error) {
                console.error("Error analyzing image:", error);
                let errorMessage = "Failed to analyze image";
                let statusCode = 500;
                if (error.code === "ECONNRESET" || error.type === "system") {
                  errorMessage = "Connection error. Please try again.";
                } else if (error.status === 429) {
                  errorMessage = "Too many requests. Please try again later.";
                  statusCode = 429;
                }
                res.statusCode = statusCode;
                res.end(JSON.stringify({
                  error: errorMessage,
                  details: error.message
                }));
              }
            });
          } else {
            res.statusCode = 405;
            res.end("Method not allowed");
          }
        });
      }
    }
  ],
  optimizeDeps: {
    exclude: ["lucide-react"]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgeyBPcGVuQUkgfSBmcm9tICdvcGVuYWknO1xuaW1wb3J0IGRvdGVudiBmcm9tICdkb3RlbnYnO1xuXG4vLyBMb2FkIGVudmlyb25tZW50IHZhcmlhYmxlc1xuZG90ZW52LmNvbmZpZygpO1xuXG4vLyBWYWxpZGF0ZSBBUEkga2V5XG5jb25zdCBPUEVOQUlfQVBJX0tFWSA9IHByb2Nlc3MuZW52Lk9QRU5BSV9BUElfS0VZO1xuaWYgKCFPUEVOQUlfQVBJX0tFWSkge1xuICBjb25zb2xlLmVycm9yKCdNaXNzaW5nIE9QRU5BSV9BUElfS0VZIGVudmlyb25tZW50IHZhcmlhYmxlJyk7XG4gIHByb2Nlc3MuZXhpdCgxKTtcbn1cblxuLy8gQ3JlYXRlIE9wZW5BSSBjbGllbnQgd2l0aCB0aW1lb3V0IGNvbmZpZ3VyYXRpb25cbmNvbnN0IG9wZW5haSA9IG5ldyBPcGVuQUkoe1xuICBhcGlLZXk6IE9QRU5BSV9BUElfS0VZLFxuICB0aW1lb3V0OiA2MDAwMCxcbiAgbWF4UmV0cmllczogM1xufSk7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCgpLFxuICAgIHtcbiAgICAgIG5hbWU6ICdpbWFnZS1hbmFseXNpcy1zZXJ2ZXInLFxuICAgICAgY29uZmlndXJlU2VydmVyKHNlcnZlcikge1xuICAgICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKCcvYXBpL2FuYWx5emUtaW1hZ2UnLCBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgICAgICAgICBpZiAocmVxLm1ldGhvZCA9PT0gJ1BPU1QnKSB7XG4gICAgICAgICAgICAvLyBTZXQgYSBsb25nZXIgdGltZW91dCBmb3IgdGhlIHJlcXVlc3RcbiAgICAgICAgICAgIHJlcS5zZXRUaW1lb3V0KDYwMDAwKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgbGV0IGJvZHkgPSAnJztcbiAgICAgICAgICAgIHJlcS5vbignZGF0YScsIGNodW5rID0+IHtcbiAgICAgICAgICAgICAgYm9keSArPSBjaHVuaztcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXEub24oJ2VuZCcsIGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCB7IGltYWdlVXJsIH0gPSBKU09OLnBhcnNlKGJvZHkpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIFZhbGlkYXRlIFVSTFxuICAgICAgICAgICAgICAgIGlmICghaW1hZ2VVcmwgfHwgdHlwZW9mIGltYWdlVXJsICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGltYWdlIFVSTCBwcm92aWRlZCcpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgb3BlbmFpLmNoYXQuY29tcGxldGlvbnMuY3JlYXRlKHtcbiAgICAgICAgICAgICAgICAgIG1vZGVsOiBcImdwdC00by1taW5pXCIsXG4gICAgICAgICAgICAgICAgICBtZXNzYWdlczogW1xuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgcm9sZTogXCJ1c2VyXCIsXG4gICAgICAgICAgICAgICAgICAgICAgY29udGVudDogW1xuICAgICAgICAgICAgICAgICAgICAgICAgeyBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJ0ZXh0XCIsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiBcIkRlc2NyaWJlIHRoaXMgZm91bmQgaXRlbSBpbiBKU09OIGZvcm1hdCB3aXRoIGZpZWxkczogbmFtZSAoc2hvcnQgdGl0bGUpLCBkZXNjcmlwdGlvbiAoY2hhcmFjdGVyaXN0aWNzIGFuZCBjb25kaXRpb24pLCB0YWdzICgyLTMga2V5d29yZHMpXCIgXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcImltYWdlX3VybFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBpbWFnZV91cmw6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cmw6IGltYWdlVXJsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICBtYXhfdG9rZW5zOiA1MDAsXG4gICAgICAgICAgICAgICAgICByZXNwb25zZV9mb3JtYXQ6IHsgdHlwZTogXCJqc29uX29iamVjdFwiIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBjb25zdCBhbmFseXNpcyA9IEpTT04ucGFyc2UocmVzcG9uc2UuY2hvaWNlc1swXS5tZXNzYWdlLmNvbnRlbnQpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIEVuc3VyZSB0aGUgcmVzcG9uc2UgbWF0Y2hlcyB0aGUgZXhwZWN0ZWQgZm9ybWF0XG4gICAgICAgICAgICAgICAgY29uc3QgZm9ybWF0dGVkQW5hbHlzaXMgPSB7XG4gICAgICAgICAgICAgICAgICBuYW1lOiBhbmFseXNpcy5uYW1lIHx8ICcnLFxuICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGFuYWx5c2lzLmRlc2NyaXB0aW9uIHx8ICcnLFxuICAgICAgICAgICAgICAgICAgdGFnczogQXJyYXkuaXNBcnJheShhbmFseXNpcy50YWdzKSA/IGFuYWx5c2lzLnRhZ3MgOiBbXVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KGZvcm1hdHRlZEFuYWx5c2lzKSk7XG4gICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgYW5hbHl6aW5nIGltYWdlOicsIGVycm9yKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyBEZXRlcm1pbmUgYXBwcm9wcmlhdGUgZXJyb3IgbWVzc2FnZVxuICAgICAgICAgICAgICAgIGxldCBlcnJvck1lc3NhZ2UgPSAnRmFpbGVkIHRvIGFuYWx5emUgaW1hZ2UnO1xuICAgICAgICAgICAgICAgIGxldCBzdGF0dXNDb2RlID0gNTAwO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIChlcnJvci5jb2RlID09PSAnRUNPTk5SRVNFVCcgfHwgZXJyb3IudHlwZSA9PT0gJ3N5c3RlbScpIHtcbiAgICAgICAgICAgICAgICAgIGVycm9yTWVzc2FnZSA9ICdDb25uZWN0aW9uIGVycm9yLiBQbGVhc2UgdHJ5IGFnYWluLic7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChlcnJvci5zdGF0dXMgPT09IDQyOSkge1xuICAgICAgICAgICAgICAgICAgZXJyb3JNZXNzYWdlID0gJ1RvbyBtYW55IHJlcXVlc3RzLiBQbGVhc2UgdHJ5IGFnYWluIGxhdGVyLic7XG4gICAgICAgICAgICAgICAgICBzdGF0dXNDb2RlID0gNDI5O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IHN0YXR1c0NvZGU7XG4gICAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IFxuICAgICAgICAgICAgICAgICAgZXJyb3I6IGVycm9yTWVzc2FnZSxcbiAgICAgICAgICAgICAgICAgIGRldGFpbHM6IGVycm9yLm1lc3NhZ2UgXG4gICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDU7XG4gICAgICAgICAgICByZXMuZW5kKCdNZXRob2Qgbm90IGFsbG93ZWQnKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgXSxcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgZXhjbHVkZTogWydsdWNpZGUtcmVhY3QnXSxcbiAgfVxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXlOLFNBQVMsb0JBQW9CO0FBQ3RQLE9BQU8sV0FBVztBQUNsQixTQUFTLGNBQWM7QUFDdkIsT0FBTyxZQUFZO0FBR25CLE9BQU8sT0FBTztBQUdkLElBQU0saUJBQWlCLFFBQVEsSUFBSTtBQUNuQyxJQUFJLENBQUMsZ0JBQWdCO0FBQ25CLFVBQVEsTUFBTSw2Q0FBNkM7QUFDM0QsVUFBUSxLQUFLLENBQUM7QUFDaEI7QUFHQSxJQUFNLFNBQVMsSUFBSSxPQUFPO0FBQUEsRUFDeEIsUUFBUTtBQUFBLEVBQ1IsU0FBUztBQUFBLEVBQ1QsWUFBWTtB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
