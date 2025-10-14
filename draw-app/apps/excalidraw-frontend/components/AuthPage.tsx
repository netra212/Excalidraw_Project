"use client";
export function AuthPage({ isSignin }: { isSignin: boolean }) {
  return (
    <div className="w-screen h-screen flex justify-center items-center">
      <div className="p-6 m-2 bg-white rounded">
        <div>
          <input type="text" placeholder="Email" />
        </div>
        <div className="p-2">
          <input placeholder="Password" type="password" />
        </div>
        <div className="p-2">
          <button
            onClick={() => {
              // hitting the backend for the signup and signin.
            }}
          >
            {isSignin ? "Sign in" : "Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}
