const { z } = require('zod');

// ── Auth schemas ──

const registerSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ── Widget schemas ──

const widgetFieldSchema = z.object({
  name: z.string().min(1).max(50),
  type: z.enum(['text', 'email', 'tel', 'textarea', 'select', 'checkbox']),
  label: z.string().min(1).max(100),
  required: z.boolean().default(false),
  placeholder: z.string().max(200).optional(),
  options: z.array(z.string()).optional(), // For select fields
});

const createWidgetSchema = z.object({
  type: z.enum(['signup', 'contact', 'cta']),
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(1000).optional().default(''),
  fields: z.array(widgetFieldSchema).min(1, 'At least one field is required').max(20),
  button_text: z.string().max(100).optional().default('Submit'),
  display_options: z.object({
    theme: z.enum(['light', 'dark']).optional().default('light'),
    position: z.enum(['inline', 'popup', 'slide-in']).optional().default('inline'),
    primary_color: z.string().max(7).optional().default('#4F46E5'),
  }).optional().default({}),
});

const updateWidgetSchema = createWidgetSchema.partial();

// ── Submission schema ──
// Dynamically validated against the widget's field definitions,
// but we enforce a basic structure here.

const submissionSchema = z.object({
  data: z.record(z.string(), z.unknown()).refine(
    (val) => JSON.stringify(val).length <= 5000,
    { message: 'Submission data too large' }
  ),
  _honeypot: z.string().optional(), // Hidden honeypot field
  idempotency_key: z.string().max(255).optional(),
});

module.exports = {
  registerSchema,
  loginSchema,
  createWidgetSchema,
  updateWidgetSchema,
  submissionSchema,
};
