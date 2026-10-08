'use strict';

const { Category, Product, ProductVariant, ProductImage } = require('../src/models');

const CATEGORIES = [
  { name: 'Men', slug: 'men', description: 'Ready-to-wear clothing for men.' },
  { name: 'Women', slug: 'women', description: 'Ready-to-wear clothing for women.' },
  { name: 'Kids', slug: 'kids', description: 'Clothing and school wear for children.' },
  { name: 'Shoes', slug: 'shoes', description: 'Footwear for every occasion.' },
  { name: 'Accessories', slug: 'accessories', description: 'Bags, belts, caps and more.' },
  { name: 'Traditional Wear', slug: 'traditional-wear', description: 'Ankara, Senator, Agbada and other native outfits.' },
  { name: 'Sportswear', slug: 'sportswear', description: 'Activewear, tracksuits and gym essentials.' },
  { name: 'Outerwear', slug: 'outerwear', description: 'Jackets, hoodies and coats.' },
];

const img = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;

const PRODUCTS = [
  {
    category: 'men',
    name: 'Classic Black T-Shirt',
    slug: 'classic-black-t-shirt',
    description: 'A timeless crew-neck tee cut from soft combed cotton. Pairs with everything in your wardrobe.',
    price: 12500,
    discountPrice: 10900,
    sku: 'TEE-BLK-001',
    brand: 'Urban Threadz',
    status: 'ACTIVE',
    images: [img('photo-1521572163474-6864f9cf17ab'), img('photo-1583743814966-8936f5b7be1a')],
    variants: [
      { size: 'S', color: 'Black', sku: 'TEE-BLK-001-S', stockQuantity: 14 },
      { size: 'M', color: 'Black', sku: 'TEE-BLK-001-M', stockQuantity: 22 },
      { size: 'L', color: 'Black', sku: 'TEE-BLK-001-L', stockQuantity: 18 },
      { size: 'XL', color: 'Black', sku: 'TEE-BLK-001-XL', stockQuantity: 9 },
      { size: 'M', color: 'White', sku: 'TEE-WHT-001-M', stockQuantity: 12 },
      { size: 'L', color: 'White', sku: 'TEE-WHT-001-L', stockQuantity: 7 },
    ],
  },
  {
    category: 'outerwear',
    name: 'Premium Hoodie',
    slug: 'premium-hoodie',
    description: 'Heavyweight 400gsm fleece hoodie with a brushed interior and ribbed cuffs.',
    price: 28500,
    discountPrice: null,
    sku: 'HOD-GRY-002',
    brand: 'Urban Threadz',
    status: 'ACTIVE',
    images: [img('photo-1556821840-3a63f95609a7'), img('photo-1620799140408-edc6dcb6d633')],
    variants: [
      { size: 'M', color: 'Grey', sku: 'HOD-GRY-002-M', stockQuantity: 11 },
      { size: 'L', color: 'Grey', sku: 'HOD-GRY-002-L', stockQuantity: 8 },
      { size: 'XL', color: 'Grey', sku: 'HOD-GRY-002-XL', stockQuantity: 5 },
      { size: 'L', color: 'Navy', sku: 'HOD-NVY-002-L', stockQuantity: 6 },
    ],
  },
  {
    category: 'traditional-wear',
    name: "Men's Senator Wear",
    slug: 'mens-senator-wear',
    description: 'Two-piece Senator outfit with embroidered chest detail, cut from premium polished cotton.',
    price: 45000,
    discountPrice: 42000,
    sku: 'SEN-NVY-003',
    brand: 'Abuja Clothiers',
    status: 'ACTIVE',
    images: [img('photo-1617137968427-85924c800a22')],
    variants: [
      { size: 'M', color: 'Navy', sku: 'SEN-NVY-003-M', stockQuantity: 6 },
      { size: 'L', color: 'Navy', sku: 'SEN-NVY-003-L', stockQuantity: 4 },
      { size: 'M', color: 'Wine', sku: 'SEN-WNE-003-M', stockQuantity: 3 },
    ],
  },
  {
    category: 'women',
    name: "Women's Ankara Dress",
    slug: 'womens-ankara-dress',
    description: 'Fitted flare dress in vibrant Ankara wax print with a side zip and pockets.',
    price: 38000,
    discountPrice: 34500,
    sku: 'ANK-GLD-004',
    brand: 'Lagos Label',
    status: 'ACTIVE',
    images: [img('photo-1594633312681-425c7b97ccd1'), img('photo-1572804013309-59a88b7e92f1')],
    variants: [
      { size: 'S', color: 'Gold', sku: 'ANK-GLD-004-S', stockQuantity: 5 },
      { size: 'M', color: 'Gold', sku: 'ANK-GLD-004-M', stockQuantity: 7 },
      { size: 'L', color: 'Gold', sku: 'ANK-GLD-004-L', stockQuantity: 4 },
      { size: 'M', color: 'Teal', sku: 'ANK-TEA-004-M', stockQuantity: 3 },
    ],
  },
  {
    category: 'shoes',
    name: 'Leather Sneakers',
    slug: 'leather-sneakers',
    description: 'Minimal low-top sneakers in full-grain leather with a cushioned insole and rubber sole.',
    price: 52000,
    discountPrice: null,
    sku: 'SNK-WHT-005',
    brand: 'Stride Co',
    status: 'ACTIVE',
    images: [img('photo-1549298916-b41d501d3772'), img('photo-1600269452121-4f2416e55c28')],
    variants: [
      { size: '40', color: 'White', sku: 'SNK-WHT-005-40', stockQuantity: 5 },
      { size: '41', color: 'White', sku: 'SNK-WHT-005-41', stockQuantity: 8 },
      { size: '42', color: 'White', sku: 'SNK-WHT-005-42', stockQuantity: 2 },
      { size: '43', color: 'Black', sku: 'SNK-BLK-005-43', stockQuantity: 6 },
    ],
  },
  {
    category: 'outerwear',
    name: 'Denim Jacket',
    slug: 'denim-jacket',
    description: 'Classic mid-wash denim jacket with button chest pockets and an adjustable waist tab.',
    price: 33500,
    discountPrice: 29900,
    sku: 'DNM-MDW-006',
    brand: 'Indigo Works',
    status: 'ACTIVE',
    images: [img('photo-1543076447-215ad9ba6923')],
    variants: [
      { size: 'M', color: 'Mid Blue', sku: 'DNM-MDW-006-M', stockQuantity: 9 },
      { size: 'L', color: 'Mid Blue', sku: 'DNM-MDW-006-L', stockQuantity: 7 },
      { size: 'XL', color: 'Mid Blue', sku: 'DNM-MDW-006-XL', stockQuantity: 4 },
    ],
  },
  {
    category: 'men',
    name: 'Cargo Trousers',
    slug: 'cargo-trousers',
    description: 'Relaxed-fit ripstop cargo trousers with six pockets and an elasticated hem.',
    price: 24000,
    discountPrice: null,
    sku: 'CRG-KHK-007',
    brand: 'Field & Co',
    status: 'ACTIVE',
    images: [img('photo-1624378439575-d8705ad7ae80')],
    variants: [
      { size: '30', color: 'Khaki', sku: 'CRG-KHK-007-30', stockQuantity: 10 },
      { size: '32', color: 'Khaki', sku: 'CRG-KHK-007-32', stockQuantity: 13 },
      { size: '34', color: 'Black', sku: 'CRG-BLK-007-34', stockQuantity: 6 },
    ],
  },
  {
    category: 'traditional-wear',
    name: 'Traditional Agbada',
    slug: 'traditional-agbada',
    description: 'Four-piece flowing Agbada in hand-woven fabric with matching fila cap and inner vest.',
    price: 85000,
    discountPrice: 79000,
    sku: 'AGB-CRM-008',
    brand: 'Abuja Clothiers',
    status: 'ACTIVE',
    images: [img('photo-1594938298603-c8148c4dae35')],
    variants: [
      { size: 'L', color: 'Cream', sku: 'AGB-CRM-008-L', stockQuantity: 3 },
      { size: 'XL', color: 'Cream', sku: 'AGB-CRM-008-XL', stockQuantity: 2 },
      { size: 'L', color: 'Emerald', sku: 'AGB-EMR-008-L', stockQuantity: 2 },
    ],
  },
  {
    category: 'kids',
    name: 'Kids Graphic Tee Pack',
    slug: 'kids-graphic-tee-pack',
    description: 'Two-pack of organic cotton graphic tees for kids, printed with water-based ink.',
    price: 9500,
    discountPrice: 8500,
    sku: 'KID-TEE-009',
    brand: 'Little Threads',
    status: 'ACTIVE',
    images: [img('photo-1519238263530-99bdd11df2ea')],
    variants: [
      { size: '4-5Y', color: 'Blue', sku: 'KID-TEE-009-45B', stockQuantity: 16 },
      { size: '6-7Y', color: 'Blue', sku: 'KID-TEE-009-67B', stockQuantity: 12 },
      { size: '6-7Y', color: 'Pink', sku: 'KID-TEE-009-67P', stockQuantity: 9 },
    ],
  },
  {
    category: 'sportswear',
    name: 'Performance Tracksuit',
    slug: 'performance-tracksuit',
    description: 'Two-piece lightweight tracksuit with moisture-wicking fabric and zip pockets.',
    price: 26500,
    discountPrice: null,
    sku: 'TRK-BLK-010',
    brand: 'Pulse Active',
    status: 'ACTIVE',
    images: [img('photo-1517836357463-d25dfeac3438')],
    variants: [
      { size: 'M', color: 'Black', sku: 'TRK-BLK-010-M', stockQuantity: 8 },
      { size: 'L', color: 'Black', sku: 'TRK-BLK-010-L', stockQuantity: 5 },
      { size: 'L', color: 'Royal Blue', sku: 'TRK-BLU-010-L', stockQuantity: 4 },
    ],
  },
  {
    category: 'accessories',
    name: 'Woven Leather Belt',
    slug: 'woven-leather-belt',
    description: 'Hand-woven genuine leather belt with a brushed metal buckle.',
    price: 11500,
    discountPrice: null,
    sku: 'BLT-BRN-011',
    brand: 'Stride Co',
    status: 'INACTIVE',
    images: [img('photo-1624222247344-550fb60583dc')],
    variants: [
      { size: '32', color: 'Brown', sku: 'BLT-BRN-011-32', stockQuantity: 0 },
      { size: '34', color: 'Brown', sku: 'BLT-BRN-011-34', stockQuantity: 0 },
    ],
  },
];

module.exports = {
  async up() {
    const categoryIds = {};
    for (const seed of CATEGORIES) {
      let category = await Category.findOne({ where: { slug: seed.slug } });
      if (!category) category = await Category.create(seed);
      categoryIds[seed.slug] = category.id;
    }

    for (const seed of PRODUCTS) {
      let product = await Product.findOne({ where: { slug: seed.slug } });
      if (!product) {
        product = await Product.create({
          categoryId: categoryIds[seed.category],
          name: seed.name,
          slug: seed.slug,
          description: seed.description,
          price: seed.price,
          discountPrice: seed.discountPrice,
          sku: seed.sku,
          brand: seed.brand,
          status: seed.status,
        });
        for (let i = 0; i < seed.images.length; i++) {
          await ProductImage.create({
            productId: product.id,
            imageUrl: seed.images[i],
            isPrimary: i === 0,
          });
        }
        for (const variant of seed.variants) {
          await ProductVariant.create({
            productId: product.id,
            size: variant.size,
            color: variant.color,
            sku: variant.sku,
            price: null,
            stockQuantity: variant.stockQuantity,
          });
        }
      }
    }
  },

  async down() {
    await ProductImage.destroy({ where: {} });
    await ProductVariant.destroy({ where: {} });
    await Product.destroy({ where: {} });
    await Category.destroy({ where: {} });
  },
};
