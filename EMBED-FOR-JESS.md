# FarmDrop Events Embed - Instructions for Jess

The FarmDrop events listing lives at `https://farmdrop.vercel.app/embed.html`. It is a self-contained HTML page sized and styled to drop cleanly into the farmdrop.us WordPress site via an `<iframe>`. The page pulls live content from a shared `content.json`, so any edit Hannah makes through her admin panel shows up on farmdrop.us automatically within about a minute. No redeploy on the farmdrop.us side is required.

## What to embed

A single iframe. Height auto-resizes via `postMessage`.

```html
<iframe
  id="farmdrop-events"
  src="https://farmdrop.vercel.app/embed.html"
  style="width:100%; border:0; display:block; min-height:800px;"
  title="FarmDrop Upcoming Events"
  loading="lazy">
</iframe>
<script>
  window.addEventListener('message', function (e) {
    if (!e.data || e.data.type !== 'farmdrop-embed-height') return;
    var f = document.getElementById('farmdrop-events');
    if (f) f.style.height = e.data.height + 'px';
  });
</script>
```

## Where to put it on farmdrop.us

The cleanest spot is a new `/events/` page (or wherever you want events to live). In the WordPress block editor, add a **Custom HTML** block and paste the iframe + script snippet above. Save and preview - the iframe will load the events and grow to fit content automatically.

If the page uses the Astra theme builder, you can also use a **Code Snippet** or **Shortcode** block; the snippet works the same either way.

### WordPress-specific notes

- If WordPress strips the `<script>` tag, use the **Code Snippets** plugin (by Shea Bunge) or move the resize listener into a theme file (`functions.php` via `wp_footer`).
- If your site is loaded over HTTPS (it is), the iframe source must stay HTTPS - already true.
- If the iframe looks cramped, you can cap max width on the wrapping block; the embed respects whatever width it is given.

## Styling

The embed uses transparent background, FarmDrop brand colors (charcoal + chartreuse), and the same visual language as the Vercel-hosted site. It should feel native on farmdrop.us. Nothing to configure.

If you want it to inherit the parent site's fonts instead, we can swap the system font stack for `inherit` - let me know.

## How the content updates

1. Hannah signs into `https://farmdrop.vercel.app/admin`
2. Edits copy on any event, section headline, or Food for Health block
3. Clicks **Save and Publish** - changes save to a shared content store
4. The iframe on farmdrop.us picks up the new content on the next page load (or a hard refresh) - no redeploy cycle

No CMS plugin, no FTP, no database touch on the WordPress side.

## Direct links (no iframe)

If embedding is not an option or you prefer to link out:

- Full events page: https://farmdrop.vercel.app/events.html
- Just the events block (bare, no nav/footer, iframe-ready): https://farmdrop.vercel.app/embed.html

## Questions

Ping Zaal (BetterCallZaal) on zaalp99@gmail.com. Happy to adjust styling, add events, tweak the embed to fit farmdrop.us's layout, or hand over full source if you want to self-host the events page on farmdrop.us directly.
