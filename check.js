fetch('https://fraud-detection-nine-gilt.vercel.app/').then(res => res.text()).then(html => console.log(html.slice(0, 500)));
