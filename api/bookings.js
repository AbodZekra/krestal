// api/bookings.js
export default async function handler(req, res) {
    const { GITHUB_TOKEN, GIST_ID } = process.env;
    
    // استخدم المفاتيح هنا
    const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`
        }
    });
    
    const data = await response.json();
    res.status(200).json(data);
}