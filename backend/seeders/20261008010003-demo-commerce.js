'use strict';

const {
  User,
  Address,
  Product,
  ProductVariant,
  Order,
  OrderItem,
  Payment,
  Rider,
  Delivery,
  DeliveryEvent,
} = require('../src/models');

const DELIVERY_FEE = 1500;
const now = Date.now();
const hoursAgo = (h) => new Date(now - h * 60 * 60 * 1000);

async function findVariant(sku) {
  const variant = await ProductVariant.findOne({ where: { sku } });
  if (!variant) throw new Error(`Missing seeded variant ${sku}`);
  return variant;
}

async function findProduct(productSlug) {
  const product = await Product.findOne({ where: { slug: productSlug } });
  if (!product) throw new Error(`Missing seeded product ${productSlug}`);
  return product;
}

function effectivePrice(product, variant) {
  if (variant.price !== null && variant.price !== undefined) return Number(variant.price);
  if (product.discountPrice !== null && product.discountPrice !== undefined) return Number(product.discountPrice);
  return Number(product.price);
}

async function ensureAddress(user, seed) {
  const existing = await Address.findOne({ where: { userId: user.id, label: seed.label } });
  if (existing) return existing;
  return Address.create({ ...seed, userId: user.id });
}

async function createOrder({ user, address, orderNumber, items, status, createdAt }) {
  const existing = await Order.findOne({ where: { orderNumber } });
  if (existing) return existing;

  let subtotal = 0;
  const rows = [];
  for (const item of items) {
    const variant = await findVariant(item.sku);
    const product = await findProduct(item.slug);
    const unitPrice = effectivePrice(product, variant);
    const lineTotal = unitPrice * item.quantity;
    subtotal += lineTotal;
    rows.push({ variant, product, unitPrice, lineTotal, quantity: item.quantity });
  }

  const order = await Order.create({
    userId: user.id,
    addressId: address.id,
    orderNumber,
    subtotal,
    deliveryFee: DELIVERY_FEE,
    discount: 0,
    totalAmount: subtotal + DELIVERY_FEE,
    status,
    createdAt,
    updatedAt: createdAt,
  });

  for (const row of rows) {
    await OrderItem.create({
      orderId: order.id,
      productId: row.product.id,
      productVariantId: row.variant.id,
      productName: row.product.name,
      size: row.variant.size,
      color: row.variant.color,
      quantity: row.quantity,
      unitPrice: row.unitPrice,
      totalPrice: row.lineTotal,
      createdAt,
      updatedAt: createdAt,
    });
  }

  return order;
}

module.exports = {
  async up() {
    const ada = await User.findOne({ where: { email: 'ada.customer@clothing-delivery.test' } });
    const chidi = await User.findOne({ where: { email: 'chidi.customer@clothing-delivery.test' } });
    const aisha = await User.findOne({ where: { email: 'aisha.customer@clothing-delivery.test' } });
    const musa = await User.findOne({ where: { email: 'musa.rider@clothing-delivery.test' } });
    const kelechi = await User.findOne({ where: { email: 'kelechi.rider@clothing-delivery.test' } });
    if (!ada || !chidi || !aisha || !musa || !kelechi) {
      throw new Error('Run the demo users seeder first.');
    }

    const homeAda = await ensureAddress(ada, {
      label: 'Home',
      recipientName: 'Ada Obi',
      phone: '+2348020000001',
      addressLine: '14 Admiralty Way, Lekki Phase 1',
      city: 'Lagos',
      state: 'Lagos',
      country: 'Nigeria',
      postalCode: '106104',
      isDefault: true,
    });
    await ensureAddress(ada, {
      label: 'Office',
      recipientName: 'Ada Obi',
      phone: '+2348020000001',
      addressLine: '3 Adeola Odeku Street, Victoria Island',
      city: 'Lagos',
      state: 'Lagos',
      country: 'Nigeria',
      postalCode: '106104',
      isDefault: false,
    });
    const homeChidi = await ensureAddress(chidi, {
      label: 'Home',
      recipientName: 'Chidi Nwosu',
      phone: '+2348020000002',
      addressLine: '7 Zik Avenue, Uwani',
      city: 'Enugu',
      state: 'Enugu',
      country: 'Nigeria',
      postalCode: '400102',
      isDefault: true,
    });
    const homeAisha = await ensureAddress(aisha, {
      label: 'Home',
      recipientName: 'Aisha Bello',
      phone: '+2348020000003',
      addressLine: '22 Ahmadu Bello Way, Zone 5',
      city: 'Abuja',
      state: 'FCT',
      country: 'Nigeria',
      postalCode: '900101',
      isDefault: true,
    });

    // Order 1: paid and confirmed, waiting to be processed
    const order1 = await createOrder({
      user: ada,
      address: homeAda,
      orderNumber: 'CDL-261008-000001',
      status: 'CONFIRMED',
      createdAt: hoursAgo(30),
      items: [{ slug: 'classic-black-t-shirt', sku: 'TEE-BLK-001-M', quantity: 2 }],
    });
    const existingPayment1 = await Payment.findOne({ where: { orderId: order1.id } });
    if (!existingPayment1) {
      await Payment.create({
        orderId: order1.id,
        amount: order1.totalAmount,
        method: 'CARD',
        status: 'SUCCESSFUL',
        transactionReference: 'TXN-DEMO-000001',
        paidAt: hoursAgo(29),
        createdAt: hoursAgo(29),
        updatedAt: hoursAgo(29),
      });
    }

    // Order 2: ready for pickup with a rider assigned
    const order2 = await createOrder({
      user: chidi,
      address: homeChidi,
      orderNumber: 'CDL-261008-000002',
      status: 'READY_FOR_PICKUP',
      createdAt: hoursAgo(20),
      items: [
        { slug: 'leather-sneakers', sku: 'SNK-WHT-005-41', quantity: 1 },
        { slug: 'cargo-trousers', sku: 'CRG-KHK-007-32', quantity: 1 },
      ],
    });
    const existingPayment2 = await Payment.findOne({ where: { orderId: order2.id } });
    if (!existingPayment2) {
      await Payment.create({
        orderId: order2.id,
        amount: order2.totalAmount,
        method: 'TRANSFER',
        status: 'SUCCESSFUL',
        transactionReference: 'TXN-DEMO-000002',
        paidAt: hoursAgo(19),
        createdAt: hoursAgo(19),
        updatedAt: hoursAgo(19),
      });
    }

    const musaProfile = await Rider.findOne({ where: { userId: musa.id } });
    const kelechiProfile = await Rider.findOne({ where: { userId: kelechi.id } });

    const existingDelivery2 = await Delivery.findOne({ where: { orderId: order2.id } });
    if (!existingDelivery2) {
      const delivery2 = await Delivery.create({
        orderId: order2.id,
        riderId: musaProfile.id,
        status: 'ASSIGNED',
        pickupTime: hoursAgo(-2),
        createdAt: hoursAgo(4),
        updatedAt: hoursAgo(4),
      });
      await DeliveryEvent.create({
        deliveryId: delivery2.id,
        actorId: null,
        previousStatus: null,
        newStatus: 'ASSIGNED',
        note: 'Rider assigned to order',
        createdAt: hoursAgo(4),
      });
      await musaProfile.update({ availability: 'BUSY' });
    }

    // Order 3: completed end to end
    const order3 = await createOrder({
      user: aisha,
      address: homeAisha,
      orderNumber: 'CDL-261008-000003',
      status: 'DELIVERED',
      createdAt: hoursAgo(50),
      items: [{ slug: 'womens-ankara-dress', sku: 'ANK-GLD-004-M', quantity: 1 }],
    });
    const existingPayment3 = await Payment.findOne({ where: { orderId: order3.id } });
    if (!existingPayment3) {
      await Payment.create({
        orderId: order3.id,
        amount: order3.totalAmount,
        method: 'CARD',
        status: 'SUCCESSFUL',
        transactionReference: 'TXN-DEMO-000003',
        paidAt: hoursAgo(49),
        createdAt: hoursAgo(49),
        updatedAt: hoursAgo(49),
      });
    }

    const existingDelivery3 = await Delivery.findOne({ where: { orderId: order3.id } });
    if (!existingDelivery3) {
      const delivery3 = await Delivery.create({
        orderId: order3.id,
        riderId: kelechiProfile.id,
        status: 'DELIVERED',
        pickupTime: hoursAgo(46),
        pickedUpAt: hoursAgo(45),
        outForDeliveryAt: hoursAgo(44),
        deliveredAt: hoursAgo(43),
        createdAt: hoursAgo(47),
        updatedAt: hoursAgo(43),
      });
      const timeline = [
        { previousStatus: null, newStatus: 'ASSIGNED', note: 'Rider assigned to order', offset: 47 },
        { previousStatus: 'ASSIGNED', newStatus: 'PICKED_UP', note: 'Picked up from dispatch hub', offset: 45 },
        { previousStatus: 'PICKED_UP', newStatus: 'IN_TRANSIT', note: 'On the way to the customer', offset: 44 },
        { previousStatus: 'IN_TRANSIT', newStatus: 'DELIVERED', note: 'Delivered to customer', offset: 43 },
      ];
      for (const event of timeline) {
        await DeliveryEvent.create({
          deliveryId: delivery3.id,
          actorId: kelechi.id,
          previousStatus: event.previousStatus,
          newStatus: event.newStatus,
          note: event.note,
          createdAt: hoursAgo(event.offset),
        });
      }
      await kelechiProfile.update({ availability: 'AVAILABLE' });
    }
  },

  async down() {
    await DeliveryEvent.destroy({ where: {} });
    await Delivery.destroy({ where: {} });
    await Payment.destroy({ where: {} });
    await OrderItem.destroy({ where: {} });
    await Order.destroy({ where: {} });
    await Address.destroy({ where: {} });
  },
};
