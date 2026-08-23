/**
 * Embeddable Widget Script
 * 
 * Usage: <script src="http://localhost:3000/widget.js?id=WIDGET_ID"></script>
 * 
 * This script:
 * 1. Reads the widget ID from its own <script> tag src
 * 2. Fetches the widget config from the API
 * 3. Renders the form into the page
 * 4. Handles form submission via the public submission API
 */
(function () {
  'use strict';

  // ── Find the widget ID from the script tag ──
  const currentScript = document.currentScript;
  if (!currentScript) {
    console.error('[Widget] Could not find the current script tag.');
    return;
  }

  const scriptSrc = currentScript.getAttribute('src');
  const urlParams = new URL(scriptSrc, window.location.href).searchParams;
  const widgetId = urlParams.get('id');

  if (!widgetId) {
    console.error('[Widget] No widget ID found. Use: <script src="widget.js?id=YOUR_ID"></script>');
    return;
  }

  // ── Derive the API base URL from the script src ──
  const scriptUrl = new URL(scriptSrc, window.location.href);
  const API_BASE = scriptUrl.origin;

  // ── Fetch widget config and render ──
  fetch(API_BASE + '/api/widgets/' + widgetId + '/config')
    .then(function (res) {
      if (!res.ok) throw new Error('Widget not found (HTTP ' + res.status + ')');
      return res.json();
    })
    .then(function (config) {
      renderWidget(config, widgetId, API_BASE);
    })
    .catch(function (err) {
      console.error('[Widget] Failed to load widget config:', err.message);
    });

  /**
   * Render the widget form into the page.
   */
  function renderWidget(config, widgetId, apiBase) {
    // Create container
    var container = document.createElement('div');
    container.id = 'widget-' + widgetId;
    container.className = 'embeddable-widget';

    var theme = (config.display_options && config.display_options.theme) || 'light';
    var primaryColor = (config.display_options && config.display_options.primary_color) || '#4F46E5';

    // Inject styles
    var style = document.createElement('style');
    style.textContent = getWidgetStyles(primaryColor, theme);
    container.appendChild(style);

    // Build form
    var wrapper = document.createElement('div');
    wrapper.className = 'ew-wrapper ew-theme-' + theme;

    // Title
    var title = document.createElement('h3');
    title.className = 'ew-title';
    title.textContent = config.title;
    wrapper.appendChild(title);

    // Description
    if (config.description) {
      var desc = document.createElement('p');
      desc.className = 'ew-description';
      desc.textContent = config.description;
      wrapper.appendChild(desc);
    }

    // Form
    var form = document.createElement('form');
    form.className = 'ew-form';
    form.setAttribute('novalidate', '');

    // Render fields
    var fields = config.fields;
    if (typeof fields === 'string') {
      try { fields = JSON.parse(fields); } catch (e) { fields = []; }
    }

    fields.forEach(function (field) {
      var group = document.createElement('div');
      group.className = 'ew-field-group';

      var label = document.createElement('label');
      label.className = 'ew-label';
      label.textContent = field.label + (field.required ? ' *' : '');
      label.setAttribute('for', 'ew-field-' + field.name);
      group.appendChild(label);

      var input;
      if (field.type === 'textarea') {
        input = document.createElement('textarea');
        input.rows = 3;
      } else if (field.type === 'select') {
        input = document.createElement('select');
        var defaultOpt = document.createElement('option');
        defaultOpt.value = '';
        defaultOpt.textContent = field.placeholder || 'Select...';
        input.appendChild(defaultOpt);
        (field.options || []).forEach(function (opt) {
          var option = document.createElement('option');
          option.value = opt;
          option.textContent = opt;
          input.appendChild(option);
        });
      } else if (field.type === 'checkbox') {
        input = document.createElement('input');
        input.type = 'checkbox';
      } else {
        input = document.createElement('input');
        input.type = field.type || 'text';
      }

      input.id = 'ew-field-' + field.name;
      input.name = field.name;
      input.className = 'ew-input';
      if (field.placeholder && field.type !== 'select') input.placeholder = field.placeholder;
      if (field.required) input.required = true;

      group.appendChild(input);
      form.appendChild(group);
    });

    // Honeypot field (hidden from humans, visible to bots)
    var honeypot = document.createElement('input');
    honeypot.type = 'text';
    honeypot.name = '_honeypot';
    honeypot.tabIndex = -1;
    honeypot.autocomplete = 'off';
    honeypot.style.cssText = 'position:absolute;left:-9999px;top:-9999px;opacity:0;height:0;width:0;';
    form.appendChild(honeypot);

    // Submit button
    var button = document.createElement('button');
    button.type = 'submit';
    button.className = 'ew-button';
    button.textContent = config.button_text || 'Submit';
    form.appendChild(button);

    // Status message area
    var status = document.createElement('div');
    status.className = 'ew-status';
    form.appendChild(status);

    wrapper.appendChild(form);
    container.appendChild(wrapper);

    // Insert after the script tag
    currentScript.parentNode.insertBefore(container, currentScript.nextSibling);

    // ── Handle form submission ──
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var formData = {};
      fields.forEach(function (field) {
        var el = form.querySelector('[name="' + field.name + '"]');
        if (el) {
          formData[field.name] = el.type === 'checkbox' ? el.checked : el.value;
        }
      });

      var payload = {
        data: formData,
        _honeypot: honeypot.value,
      };

      button.disabled = true;
      button.textContent = 'Sending...';
      status.textContent = '';
      status.className = 'ew-status';

      fetch(apiBase + '/api/submit/' + widgetId, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(function (res) {
          if (res.status === 429) {
            throw new Error('Too many submissions. Please wait a moment.');
          }
          if (!res.ok) {
            return res.json().then(function (data) {
              throw new Error(data.message || 'Submission failed');
            });
          }
          return res.json();
        })
        .then(function (data) {
          status.textContent = 'Thank you! Your submission has been received.';
          status.className = 'ew-status ew-status-success';
          form.reset();
        })
        .catch(function (err) {
          status.textContent = err.message || 'Something went wrong. Please try again.';
          status.className = 'ew-status ew-status-error';
        })
        .finally(function () {
          button.disabled = false;
          button.textContent = config.button_text || 'Submit';
        });
    });
  }

  /**
   * Generate widget CSS styles.
   */
  function getWidgetStyles(primaryColor, theme) {
    var bg = theme === 'dark' ? '#1a1a2e' : '#ffffff';
    var text = theme === 'dark' ? '#e0e0e0' : '#333333';
    var inputBg = theme === 'dark' ? '#16213e' : '#f9fafb';
    var border = theme === 'dark' ? '#2a2a4a' : '#d1d5db';

    return [
      '.ew-wrapper { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; ',
      '  max-width: 420px; padding: 24px; border-radius: 12px; ',
      '  background: ' + bg + '; color: ' + text + '; ',
      '  box-shadow: 0 4px 24px rgba(0,0,0,0.12); border: 1px solid ' + border + '; }',
      '.ew-title { margin: 0 0 8px; font-size: 20px; font-weight: 700; }',
      '.ew-description { margin: 0 0 16px; font-size: 14px; opacity: 0.8; }',
      '.ew-field-group { margin-bottom: 14px; }',
      '.ew-label { display: block; margin-bottom: 4px; font-size: 13px; font-weight: 600; }',
      '.ew-input { width: 100%; padding: 10px 12px; border: 1px solid ' + border + '; ',
      '  border-radius: 8px; font-size: 14px; background: ' + inputBg + '; color: ' + text + '; ',
      '  box-sizing: border-box; transition: border-color 0.2s; }',
      '.ew-input:focus { outline: none; border-color: ' + primaryColor + '; box-shadow: 0 0 0 3px ' + primaryColor + '33; }',
      'textarea.ew-input { resize: vertical; }',
      '.ew-button { width: 100%; padding: 12px; border: none; border-radius: 8px; ',
      '  background: ' + primaryColor + '; color: #fff; font-size: 15px; font-weight: 600; ',
      '  cursor: pointer; transition: opacity 0.2s; margin-top: 8px; }',
      '.ew-button:hover { opacity: 0.9; }',
      '.ew-button:disabled { opacity: 0.6; cursor: not-allowed; }',
      '.ew-status { margin-top: 12px; font-size: 13px; min-height: 20px; }',
      '.ew-status-success { color: #059669; }',
      '.ew-status-error { color: #dc2626; }',
    ].join('\n');
  }
})();
