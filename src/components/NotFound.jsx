import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="flex-1 flex items-center justify-center bg-base-200/40 min-h-screen">
      <div className="text-center flex flex-col items-center gap-4 p-8">
        <div
          className="text-9xl font-black text-primary/20 select-none"
          style={{ lineHeight: 1 }}
        >
          404
        </div>
        <h1 className="text-3xl font-bold">Page not found</h1>
        <p className="text-base-content/60 text-sm max-w-sm">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn btn-primary btn-sm mt-2 px-6 shadow">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
