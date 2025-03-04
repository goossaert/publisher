// server.js
//
// Setup
// - In phpPgAdmin, execute the following queries on Namecheap:
//       GRANT INSERT, SELECT, UPDATE, DELETE ON TABLE posts TO swtec_publisher_user;
//       GRANT USAGE, SELECT ON SEQUENCE posts_id_seq TO swtec_publisher_user;

const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));
const router = express.Router();
const port = process.env.PORT || 3000;

// Configure the PostgreSQL pool.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

// GET endpoint to receive the published content
router.get('/', async (req, res) => {
    res.send(`The server is working!`);
});

// POST endpoint to receive the published content
router.post('/publish', async (req, res) => {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).send('Missing title or content');
    }
    
    try {
      const result = await pool.query(
        'INSERT INTO posts (title, content, created_at) VALUES ($1, $2, NOW()) RETURNING id',
        [title, content]
      );
      const newId = result.rows[0].id;
      // Redirect to the new post view page.
      res.redirect(`/publisher/post/${newId}`);
    } catch (err) {
      console.error('Error inserting post:', err);
      res.status(500).send('Internal server error');
    }
  });
  
  

// GET endpoint for the "add" route (manual add via a form) with HTML formatting support
router.get('/add', async (req, res) => {
  res.send(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>Add New Post</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
          header, footer { background: #f4f4f4; padding: 1em; }
          nav ul { list-style: none; padding: 0; }
          nav li { display: inline; margin-right: 1em; }
          main { padding: 1em; }
          form { max-width: 600px; margin: auto; }
          input[type="text"] { width: 100%; padding: 0.5em; margin-bottom: 1em; }
          #content-editor {
            border: 1px solid #ccc;
            padding: 0.5em;
            min-height: 200px;
            margin-bottom: 1em;
          }
          button { padding: 0.5em 1em; }
        </style>
      </head>
      <body>
        <header>
          <nav>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/publisher/posts">All Posts</a></li>
              <li><a href="/publisher/add">Add Post</a></li>
            </ul>
          </nav>
        </header>
        <main>
          <h1>Add New Post</h1>
          <form method="POST" action="/publisher/add" onsubmit="processContent()">
            <label for="title">Title:</label><br/>
            <input type="text" id="title" name="title" required><br/>
            <label for="content-editor">Content (HTML formatting allowed):</label><br/>
            <!-- Contenteditable div for formatted content -->
            <div id="content-editor" contenteditable="true"></div>
            <!-- Hidden field to store the HTML content -->
            <input type="hidden" id="content" name="content">
            <button type="submit">Add Post</button>
          </form>
        </main>
        <footer>
          <p>&copy; 2025 Publisher</p>
        </footer>
        <script>
          function processContent() {
            var editor = document.getElementById('content-editor');
            // Create a temporary container to manipulate the HTML
            var container = document.createElement('div');
            container.innerHTML = editor.innerHTML;
            // Remove only the color and background-color properties from all elements
            container.querySelectorAll('*').forEach(function(el) {
              el.style.removeProperty('color');
              el.style.removeProperty('background-color');
            });
            // Set the cleaned HTML to the hidden field
            document.getElementById('content').value = container.innerHTML;
          }
        </script>
      </body>
    </html>
  `);
});

// POST endpoint for the "add" route (processing the form submission)
router.post('/add', async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).send('Missing title or content');
  }
  
  try {
    const result = await pool.query(
      'INSERT INTO posts (title, content, created_at) VALUES ($1, $2, NOW()) RETURNING id',
      [title, content]
    );
    const newId = result.rows[0].id;
    // Redirect to the new post view page.
    res.redirect(`/publisher/post/${newId}`);
  } catch (err) {
    console.error('Error inserting post:', err);
    res.status(500).send('Internal server error');
  }
});
  

// GET endpoint to display the post with proper HTML formatting
router.get('/post/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT title, content, created_at FROM posts WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).send('Post not found');
    }
    const post = result.rows[0];
    // Render a semantic HTML5 page.
    res.send(`
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <title>${post.title}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
            header, footer { background: #f4f4f4; padding: 1em; }
            nav ul { list-style: none; padding: 0; }
            nav li { display: inline; margin-right: 1em; }
            main { padding: 1em; }
            article { margin-bottom: 2em; }
          </style>
        </head>
        <body>
          <!-- Site Header with Navigation -->
          <header>
            <nav>
              <ul>
                <li><a href="/">Home</a></li>
                <li><a href="/publisher/posts">All Posts</a></li>
                <li><a href="/publisher/add">Add Post</a></li>
              </ul>
            </nav>
          </header>
          
          <!-- Main Content Area -->
          <main>
            <article>
              <!-- Post Header -->
              <header>
                <h1>${post.title}</h1>
              </header>
              
              <!-- Post Content Section -->
              <section>
                ${post.content}
              </section>
              
              <!-- Post Footer with Metadata -->
              <footer>
                <p>Published on ${new Date(post.created_at).toLocaleString()}</p>
              </footer>
            </article>
          </main>
          
          <!-- Site Footer -->
          <footer>
            <p>&copy; 2025 Publisher</p>
          </footer>
        </body>
      </html>
    `);
  } catch (err) {
    console.error('Error retrieving post:', err);
    res.status(500).send('Internal server error');
  }
});


// List all posts with checkboxes for deletion.
router.get('/posts', async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT id, title, created_at FROM posts ORDER BY created_at DESC'
      );
      // Create an HTML list with checkboxes and links for each post.
      const postsHtml = result.rows.map(row => {
        return `<li>
                  <input type="checkbox" name="postIds" value="${row.id}">
                  <a href="/publisher/post/${row.id}">${row.title}</a>
                  <small>(${new Date(row.created_at).toLocaleString()})</small>
                </li>`;
      }).join('');
      
      res.send(`
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <title>All Posts</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
              header, footer { background: #f4f4f4; padding: 1em; }
              nav ul { list-style: none; padding: 0; }
              nav li { display: inline; margin-right: 1em; }
              main { padding: 1em; }
              ul { list-style: none; padding: 0; }
              li { margin-bottom: 0.5em; }
            </style>
          </head>
          <body>
            <!-- Site Header with Navigation -->
            <header>
              <nav>
                <ul>
                  <li><a href="/">Home</a></li>
                  <li><a href="/publisher/posts">All Posts</a></li>
                  <li><a href="/publisher/add">Add Post</a></li>
                </ul>
              </nav>
            </header>
            
            <!-- Main Content Area -->
            <main>
              <h1>All Posts</h1>
              <form method="POST" action="/publisher/posts">
                <ul>
                  ${postsHtml}
                </ul>
                <button type="submit" name="action" value="delete">Delete Selected Posts</button>
              </form>
            </main>
            
            <!-- Site Footer -->
            <footer>
              <p>&copy; 2025 Publisher</p>
            </footer>
          </body>
        </html>
      `);
    } catch (err) {
      console.error('Error retrieving posts:', err);
      res.status(500).send('Internal server error');
    }
  });
  
  // Delete selected posts.
  router.post('/posts', async (req, res) => {
    // When the "Delete Selected Posts" button is pressed,
    // the form sends an "action" parameter and the checked postIds.
    const { action, postIds } = req.body;
    
    if (action === 'delete' && postIds) {
      // Ensure postIds is an array even if one checkbox is selected.
      const ids = Array.isArray(postIds) ? postIds : [postIds];
      // Convert ids to integers (if needed)
      const idInts = ids.map(id => parseInt(id, 10));
      
      try {
        await pool.query('DELETE FROM posts WHERE id = ANY($1::int[])', [idInts]);
      } catch (err) {
        console.error('Error deleting posts:', err);
        return res.status(500).send('Internal server error');
      }
    }
    
    // After deletion, redirect back to the posts list.
    res.redirect('/publisher/posts');
  });



app.use('/publisher', router);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
