import { Navigate } from "react-router-dom";
// La page /reserver est fusionnée dans /planning
const BookingPage = () => <Navigate to="/planning" replace />;
export default BookingPage;
