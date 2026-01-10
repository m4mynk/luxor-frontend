const RefundPolicy = () => {
  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Cancellation & Refund Policy</h1>

      <p className="mb-4">
        Orders can be cancelled only before they are shipped. Once shipped,
        cancellations are not allowed.
      </p>

      <p className="mb-4">
        Refunds for approved cancellations will be processed within 5–7 business
        days to the original payment method.
      </p>

      <p>
        In case of damaged or incorrect products, customers may contact support
        within 48 hours of delivery.
      </p>
    </div>
  );
};

export default RefundPolicy;