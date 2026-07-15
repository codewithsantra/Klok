"use client";

import { SignIn } from "@clerk/nextjs";

// Clerk handles the whole flow: credentials, forgot/reset password,
// email verification, and session creation.
export default function SignInPage() {
  return (
    <div className="flex justify-center">
      <SignIn
        routing="hash"
        appearance={{
          variables: {
            colorPrimary: "#6C6FDF",
            borderRadius: "10px",
          },
        }}
      />
    </div>
  );
}
