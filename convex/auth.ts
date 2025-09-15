import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Admin password - for development
const ADMIN_PASSWORD = "CafeHopper2025!";

// Store admin session
export const authenticateAdmin = mutation({
  args: { password: v.string() },
  handler: async (ctx, args) => {
    console.log("Attempting authentication with password:", args.password);
    console.log("Expected password:", ADMIN_PASSWORD);
    console.log("Match:", args.password === ADMIN_PASSWORD);
    
    if (args.password === ADMIN_PASSWORD) {
      // In a real app, you'd create a session token here
      // For simplicity, we'll just return success
      return { success: true, token: "admin-authenticated" };
    }
    return { success: false, error: "Invalid password" };
  },
});

// Check if user is authenticated (you could extend this to check session tokens)
export const isAdminAuthenticated = query({
  args: { token: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // Simple check - in production you'd validate session tokens
    return args.token === "admin-authenticated";
  },
});