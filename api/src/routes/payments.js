const crypto = require('crypto');
const express = require('express');
const Razorpay = require('razorpay');
const { sessionAuth } = require('../middleware/sessionAuth');
const { createOrder, markOrderPaid, adjustCredits } = require('../services/postgres');
const config = require('../config');

const router = express.Router();
router.use(sessionAuth);

function getRazorpay() {
  return new Razorpay({
    key_id: config.razorpay.keyId,
    key_secret: config.razorpay.keySecret,
  });
}

// POST /dashboard/payments/create-order
router.post('/create-order', async (req, res) => {
  const { packId } = req.body;
  const pack = config.creditPacks[packId];
  if (!pack) return res.status(400).json({ error: 'Invalid pack' });

  try {
    const rzp = getRazorpay();
    const rzpOrder = await rzp.orders.create({
      amount: pack.amountPaise,
      currency: 'INR',
      receipt: `dyaus_${req.session.userId.slice(0, 8)}_${Date.now()}`,
    });

    await createOrder({
      userId: req.session.userId,
      razorpayOrderId: rzpOrder.id,
      amountPaise: pack.amountPaise,
      credits: pack.credits,
      packName: pack.name,
    });

    res.json({ orderId: rzpOrder.id, amount: pack.amountPaise, currency: 'INR' });
  } catch (err) {
    console.error('create-order error:', err.message);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// POST /dashboard/payments/verify
router.post('/verify', async (req, res) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing payment fields' });
  }

  const expected = crypto
    .createHmac('sha256', config.razorpay.keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expected !== razorpay_signature) {
    return res.status(400).json({ error: 'Invalid payment signature' });
  }

  try {
    const order = await markOrderPaid({
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      userId: req.session.userId,
    });

    if (!order) return res.status(404).json({ error: 'Order not found or already processed' });

    await adjustCredits(req.session.userId, order.credits);

    res.json({ ok: true, creditsAdded: order.credits, packName: order.pack_name });
  } catch (err) {
    console.error('verify-payment error:', err.message);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

module.exports = router;
