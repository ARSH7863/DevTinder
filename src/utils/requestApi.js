import axios from "axios";
import { BASE_URL } from "./constants";

/**
 * Send a connection request to a user.
 * @param {"interested" | "ignored"} status - Type of connection request
 * @param {string} toUserId - Target developer's user ID
 * @returns {Promise<AxiosResponse>}
 */
export const sendConnectionRequest = async (status, toUserId) => {
  return await axios.post(
    `${BASE_URL}/request/send/${status}/${toUserId}`,
    {},
    { withCredentials: true }
  );
};

/**
 * Review an incoming connection request (Accept or Reject).
 * @param {"accepted" | "rejected"} status - Review decision
 * @param {string} requestId - The connection request document ID
 * @returns {Promise<AxiosResponse>}
 */
export const reviewConnectionRequest = async (status, requestId) => {
  return await axios.post(
    `${BASE_URL}/request/review/${status}/${requestId}`,
    {},
    { withCredentials: true }
  );
};
