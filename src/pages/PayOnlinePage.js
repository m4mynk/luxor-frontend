// src/pages/PayOnlinePage.js
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";


const gpay =
  "https://upload.wikimedia.org/wikipedia/commons/2/2a/Google_Pay_Logo.svg";
const phonepe =
  "https://upload.wikimedia.org/wikipedia/commons/f/f2/PhonePe_Logo.svg";
const paytm =
  "https://upload.wikimedia.org/wikipedia/commons/5/55/Paytm_logo.png";

const card =
  "https://cdn-icons-png.flaticon.com/512/633/633611.png";
const netbanking =
  "https://cdn-icons-png.flaticon.com/512/2838/2838838.png";

const loadRazorpay = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const PayOnlinePage = () => {
  const navigate = useNavigate();
  const { state } = useLocation();

  const totalPrice = state?.totalPrice;

  React.useEffect(() => {
    if (!totalPrice) navigate("/checkout");
  }, [totalPrice, navigate]);

  const [paying, setPaying] = React.useState(false);
  const [paymentError, setPaymentError] = React.useState("");

  const handlePayment = async (method) => {
    setPaymentError("");
    const loaded = await loadRazorpay();
    if (!loaded) {
      alert("Razorpay SDK failed to load");
      return;
    }

    try {
      setPaying(true);
      // Create Razorpay order (amount decided by backend)
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/payment/order`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: totalPrice }),
      });

      if (!res.ok) {
        let errorMessage = "Failed to create payment order";
        try {
          const errorData = await res.json();
          if (errorData?.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // ignore JSON parse errors
        }
        console.error("Payment order API failed:", errorMessage);
        throw new Error(errorMessage);
      }

      const data = await res.json();

      if (!data?.id || !data?.amount) {
        throw new Error("Invalid Razorpay order response");
      }

      if (!process.env.REACT_APP_RAZORPAY_KEY_ID) {
        throw new Error("Razorpay key missing");
      }

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        order_id: data.id,
        name: "Luxor",
        description: "Order Payment",
        method: {
          upi: ["gpay", "phonepe", "paytm", "upi"].includes(method),
          card: method === "card",
          netbanking: method === "netbanking",
        },
        handler: async function (response) {
          const verifyRes = await fetch(`${process.env.REACT_APP_API_URL}/api/payment/verify`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyRes.json();
          navigate("/payment-success", {
            state: { orderId: verifyData.orderId }
          });
        },
        theme: {
          color: "#000000",
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", function () {
        setPaymentError(
          "Your payment didn’t go through. No money was deducted."
        );
        setPaying(false);
      });

      razorpay.open();
    } catch (err) {
      setPaying(false);
      console.error("Payment failed:", err);
      setPaymentError(
        "Something went wrong while opening payment. Please try again."
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 flex justify-center
                animate-fadeIn">
      <div className="w-full max-w-3xl bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-8">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-500 hover:text-black transition mb-4"
        >
          ← Back to Checkout
        </button>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-semibold text-black mb-1">
          Choose a payment option
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          Pay securely using UPI or other methods
        </p>
        <div className="bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 mb-6">
          <p className="text-sm text-gray-700">
            ⚡ <span className="font-medium text-black">UPI orders ship faster</span> and
            have lower cancellation rates.
          </p>
        </div>

        {paymentError && (
          <div className="mb-6 border border-gray-300 bg-gray-50 rounded-xl p-4 animate-fadeIn">
            <p className="text-sm text-gray-800 mb-3">
              ⚠️ <span className="font-medium">Payment failed.</span> {paymentError}
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setPaymentError("")}
                className="px-4 py-2 rounded-full border border-black text-black
                           hover:bg-black hover:text-white transition text-sm"
              >
                Try Again
              </button>

              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 rounded-full border border-gray-400 text-gray-700
                           hover:bg-gray-200 transition text-sm"
              >
                Choose another method
              </button>

              <button
                onClick={() => navigate("/checkout")}
                className="px-4 py-2 rounded-full text-gray-500 hover:text-black transition text-sm"
              >
                Back to checkout
              </button>
            </div>
          </div>
        )}

        {/* UPI APPS */}
        <h2 className="text-base font-medium text-black mb-3">
          UPI Apps
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PayOption
            label="Google Pay"
            icon={gpay}
            onClick={() => handlePayment("gpay")}
          />
          <PayOption
            label="PhonePe"
            icon={phonepe}
            onClick={() => handlePayment("phonepe")}
          />
          <PayOption
            label="Paytm"
            icon={paytm}
            onClick={() => handlePayment("paytm")}
          />
          <PayOption
            label="UPI ID"
            textOnly
            onClick={() => handlePayment("upi")}
          />
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-6"></div>

        {/* OTHER METHODS */}
        <h2 className="text-base font-medium text-black mb-3">
          Other payment methods
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PayOption
            label="Credit / Debit Card"
            icon={card}
            onClick={() => handlePayment("card")}
          />
          <PayOption
            label="Net Banking"
            icon={netbanking}
            onClick={() => handlePayment("netbanking")}
          />
        </div>

        {/* Sticky Footer (Mobile Friendly) */}
        <div className="mt-8 sm:mt-10 border-t border-gray-200 pt-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Total Payable</p>
            <p className="text-xl font-semibold text-black">
              ₹{totalPrice}
            </p>
          </div>

          <button
            disabled={paying}
            onClick={() => handlePayment("default")}
            className={`px-6 sm:px-8 py-3 rounded-full font-medium transition
              ${paying
                ? "bg-gray-700 text-gray-300 cursor-not-allowed"
                : "bg-black text-white hover:bg-gray-900"
              }`}
          >
            {paying ? "Opening payment…" : "Pay Securely"}
          </button>
        </div>

        <p className="text-[11px] text-gray-400 text-center mt-5">
          100% secure payments • Encrypted • Trusted UPI apps
        </p>
      </div>
    </div>
  );
};

const PayOption = ({ label, icon, onClick, textOnly }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-4 px-4 py-4 border border-gray-300
               rounded-xl hover:border-black hover:bg-gray-100
               transition-all duration-200
               hover:scale-[1.02] active:scale-[0.98]"
  >
    {!textOnly && (
      <img
        src={icon}
        alt={label}
        className="h-8 w-auto object-contain"
      />
    )}
    <span className="font-medium text-black">{label}</span>
  </button>
);

export default PayOnlinePage;