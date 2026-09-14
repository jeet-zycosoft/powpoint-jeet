<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
  exclude-result-prefixes="sitemap xhtml">

  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <title>XML Sitemap</title>
        <style>
          :root {
            color-scheme: light dark;
          }
          body {
            margin: 0;
            font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
            background: #f6f7f8;
            color: #1b1f23;
            line-height: 1.45;
          }
          header {
            padding: 1.25rem 1.5rem;
            background: #ffffff;
            border-bottom: 1px solid #e5e7eb;
          }
          h1 {
            margin: 0 0 0.35rem;
            font-size: 1.35rem;
          }
          p {
            margin: 0;
            color: #5b6470;
            font-size: 0.95rem;
          }
          main {
            padding: 1rem 1.5rem 2rem;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            overflow: hidden;
          }
          th, td {
            padding: 0.75rem 0.9rem;
            text-align: left;
            vertical-align: top;
            border-bottom: 1px solid #eef1f4;
            font-size: 0.92rem;
          }
          th {
            background: #f3f4f6;
            font-weight: 700;
          }
          tr:last-child td {
            border-bottom: none;
          }
          a {
            color: #0b57d0;
            text-decoration: none;
            word-break: break-all;
          }
          a:hover {
            text-decoration: underline;
          }
          .meta {
            white-space: nowrap;
            color: #4b5563;
          }
          @media (max-width: 720px) {
            th:nth-child(3),
            td:nth-child(3),
            th:nth-child(4),
            td:nth-child(4) {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <header>
          <h1>XML Sitemap</h1>
          <p>
            This XML sitemap contains
            <xsl:value-of select="count(sitemap:urlset/sitemap:url)"/>
            URLs for search engines.
          </p>
        </header>
        <main>
          <table>
            <thead>
              <tr>
                <th>URL</th>
                <th>Last Modified</th>
                <th>Change Frequency</th>
                <th>Priority</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="sitemap:urlset/sitemap:url">
                <tr>
                  <td>
                    <a href="{sitemap:loc}">
                      <xsl:value-of select="sitemap:loc"/>
                    </a>
                  </td>
                  <td class="meta"><xsl:value-of select="sitemap:lastmod"/></td>
                  <td class="meta"><xsl:value-of select="sitemap:changefreq"/></td>
                  <td class="meta"><xsl:value-of select="sitemap:priority"/></td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
