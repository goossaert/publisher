# publisher
A small Node.js application to save text snippets via a bookmarklet or by adding them manually. It uses Postgres as database storage, and it was tested with Node.js v14.21.2. The code was generated with OpenAI's o3-mini-high model.

The main use case for this application to save snippets of text or entire pages from any website (including ChatGPT) so they can easily be saved to Pocket (https://getpocket.com). From there, those saved pages on Pocket can be exported to an ereader for later reading without exposure to blue lights from computer screens.

To use the application:

- Replace all occurrences of `/publisher` in `server.js` by whatever path you want the application to run.
- Set environment variables `DATABASE_URL` to your Postgres connection URL and set `NODE_ENV` to `production`.
- Copy the content of `bookmarkelet.txt` as a single line in a bookmark of your web browser (replace `domain.com` with the pass to your hosting service).
- Once the appliation is running, you can go to any website, select a bit of text, and then click on the bookmark containing the bookmarklet. The text will be saved by the application as a new post, and the title of the original page will be used as title for the post.

Below are the SQL statements you should run on your Postgres database before you start using the application. The first query creates the table, and the next two queries grant the proper privileges to your user. Replace `your_user_name` with the user name.

`
-- Create the "posts" table with the required columns.
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Grant table privileges.
GRANT INSERT, SELECT, UPDATE, DELETE ON TABLE posts TO your_user_name;

-- Grant privileges on the auto-created sequence.
GRANT USAGE, SELECT ON SEQUENCE posts_id_seq TO your_user_name;
`
