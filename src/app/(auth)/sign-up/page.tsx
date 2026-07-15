"use client";

import { SignUp } from "@clerk/nextjs";

// Clerk handles account creation and email verification; after sign-up the
// user lands on /onboarding (NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL).
export default function SignUpPage() {
  return (
    <div className="flex justify-center">
      <SignUp
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
