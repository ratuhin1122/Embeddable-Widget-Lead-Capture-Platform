/**
 * Seed script — creates demo data for testing and demo purposes.
 * Run: node src/db/seed.js
 */
require('dotenv').config();

const bcrypt = require('bcryptjs');
const db = require('./connection');
const { v4: uuidv4 } = require('uuid');

async function seed() {
  console.log('🌱 Seeding database...\n');

  try {
    // Run migrations first
    const knexConfig = require('./knexfile');
    await db.migrate.latest(knexConfig);
    console.log('✅ Migrations applied\n');

    // Clean existing data
    await db('submissions').del();
    await db('widgets').del();
    await db('users').del();
    console.log('🧹 Cleaned existing data\n');

    // Create demo user
    const userId = uuidv4();
    const passwordHash = await bcrypt.hash('demo1234', 12);
    await db('users').insert({
      id: userId,
      email: 'demo@example.com',
      password_hash: passwordHash,
    });
    console.log('👤 Demo user created:');
    console.log('   Email:    demo@example.com');
    console.log('   Password: demo1234\n');

    // Create a second user (for tenant isolation testing)
    const userId2 = uuidv4();
    const passwordHash2 = await bcrypt.hash('other1234', 12);
    await db('users').insert({
      id: userId2,
      email: 'other@example.com',
      password_hash: passwordHash2,
    });
    console.log('👤 Second user created (for tenant isolation tests):');
    console.log('   Email:    other@example.com');
    console.log('   Password: other1234\n');

    // Create widgets for demo user
    const widget1Id = uuidv4();
    await db('widgets').insert({
      id: widget1Id,
      user_id: userId,
      type: 'contact',
      title: 'Contact Us',
      description: 'Get in touch with our team',
      fields: JSON.stringify([
        { name: 'name', type: 'text', label: 'Full Name', required: true, placeholder: 'John Doe' },
        { name: 'email', type: 'email', label: 'Email Address', required: true, placeholder: 'john@example.com' },
        { name: 'message', type: 'textarea', label: 'Message', required: true, placeholder: 'How can we help?' },
      ]),
      button_text: 'Send Message',
      display_options: JSON.stringify({ theme: 'light', position: 'inline', primary_color: '#4F46E5' }),
    });

    const widget2Id = uuidv4();
    await db('widgets').insert({
      id: widget2Id,
      user_id: userId,
      type: 'signup',
      title: 'Newsletter Signup',
      description: 'Stay updated with our latest news',
      fields: JSON.stringify([
        { name: 'email', type: 'email', label: 'Email', required: true, placeholder: 'you@example.com' },
        { name: 'name', type: 'text', label: 'Name', required: false, placeholder: 'Your name' },
      ]),
      button_text: 'Subscribe',
      display_options: JSON.stringify({ theme: 'dark', position: 'inline', primary_color: '#059669' }),
    });

    const widget3Id = uuidv4();
    await db('widgets').insert({
      id: widget3Id,
      user_id: userId,
      type: 'cta',
      title: 'Get a Free Quote',
      description: 'Tell us about your project',
      fields: JSON.stringify([
        { name: 'name', type: 'text', label: 'Name', required: true, placeholder: 'Your name' },
        { name: 'email', type: 'email', label: 'Email', required: true, placeholder: 'you@example.com' },
        { name: 'phone', type: 'tel', label: 'Phone', required: false, placeholder: '+1 (555) 000-0000' },
        { name: 'service', type: 'select', label: 'Service', required: true, options: ['Web Development', 'Mobile App', 'Consulting', 'Other'] },
      ]),
      button_text: 'Request Quote',
      display_options: JSON.stringify({ theme: 'light', position: 'inline', primary_color: '#dc2626' }),
    });

    console.log('📦 Widgets created:');
    console.log(`   1. Contact Us     (ID: ${widget1Id})`);
    console.log(`   2. Newsletter     (ID: ${widget2Id})`);
    console.log(`   3. Free Quote     (ID: ${widget3Id})\n`);

    // Create sample submissions
    const countries = ['United States', 'United Kingdom', 'Germany', 'Canada', 'Australia', 'France'];
    const cities = ['New York', 'London', 'Berlin', 'Toronto', 'Sydney', 'Paris'];

    for (let i = 0; i < 15; i++) {
      const widgetIds = [widget1Id, widget2Id, widget3Id];
      const wid = widgetIds[i % 3];
      const countryIdx = i % countries.length;

      await db('submissions').insert({
        id: uuidv4(),
        widget_id: wid,
        user_id: userId,
        data: JSON.stringify({
          name: `User ${i + 1}`,
          email: `user${i + 1}@example.com`,
          message: `Sample submission #${i + 1}`,
        }),
        ip_address: `203.0.113.${i + 1}`,
        geo_data: JSON.stringify({
          provider: 'seed',
          country: countries[countryIdx],
          city: cities[countryIdx],
          region: null,
          lat: null,
          lon: null,
        }),
        honeypot_triggered: false,
        created_at: new Date(Date.now() - (i * 86400000)), // Spread over past 15 days
      });
    }

    console.log('📨 15 sample submissions created (spread over 15 days)\n');

    // Print embed snippets
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 EMBED SNIPPETS — paste into test-page/index.html:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`\n<script src="http://localhost:3000/widget.js?id=${widget1Id}"></script>`);
    console.log(`<script src="http://localhost:3000/widget.js?id=${widget2Id}"></script>`);
    console.log(`<script src="http://localhost:3000/widget.js?id=${widget3Id}"></script>\n`);

    console.log('✅ Seed complete! Start the server with: npm run dev\n');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    console.error(err.stack);
  } finally {
    await db.destroy();
  }
}

seed();
