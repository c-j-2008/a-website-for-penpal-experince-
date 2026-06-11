const GIST_FILENAME = "letters.json";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json",
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers };
  }

  const token = process.env.GITHUB_TOKEN;
  const gistId = process.env.GITHUB_GIST_ID;

  if (!token || !gistId) {
    return json(500, { error: "Missing GitHub environment variables." });
  }

  try {
    if (event.httpMethod === "GET") {
      const letters = await readLetters(token, gistId);
      return json(200, letters);
    }

    if (event.httpMethod === "POST") {
      const letter = JSON.parse(event.body || "{}");
      const letters = await readLetters(token, gistId);
      const nextLetters = [cleanLetter(letter), ...letters];
      await writeLetters(token, gistId, nextLetters);
      return json(200, nextLetters);
    }

    return json(405, { error: "Method not allowed." });
  } catch (error) {
    return json(500, { error: error.message });
  }
};

async function readLetters(token, gistId) {
  const gist = await githubFetch(token, `https://api.github.com/gists/${gistId}`);
  const file = gist.files?.[GIST_FILENAME];

  if (!file?.content) {
    return [];
  }

  const parsed = JSON.parse(file.content);
  return Array.isArray(parsed) ? parsed : [];
}

async function writeLetters(token, gistId, letters) {
  await githubFetch(token, `https://api.github.com/gists/${gistId}`, {
    method: "PATCH",
    body: JSON.stringify({
      files: {
        [GIST_FILENAME]: {
          content: JSON.stringify(letters, null, 2),
        },
      },
    }),
  });
}

async function githubFetch(token, url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub request failed: ${response.status} ${text}`);
  }

  return response.json();
}

function cleanLetter(letter) {
  return {
    title: String(letter.title || "").slice(0, 80),
    body: String(letter.body || "").slice(0, 5000),
    from: letter.from === "moon" ? "moon" : "pen",
    to: letter.to === "pen" ? "pen" : "moon",
    createdAt: letter.createdAt || new Date().toISOString(),
  };
}

function json(statusCode, body) {
  return {
    statusCode,
    headers,
    body: JSON.stringify(body),
  };
}
