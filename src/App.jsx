import Body from "./Body";
import Login from "./Login";
import Profile from "./Profile";
import { BrowserRouter, Routes, Route } from "react-router-dom";

const App = () => {
  return (
    <>
      <BrowserRouter basename="/">
        <Routes>
          <Route path="/" element={<Body />}>
            <Route path="/login" element={<Login />}></Route>
            <Route path="/profile" element={<Profile />}></Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
};

export default App;
