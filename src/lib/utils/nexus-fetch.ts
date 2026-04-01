let nexusMods: NexusModType[];

const query = `query {
    mods(
        filter: {
            gameDomainName: [{ value: "thecrew", op: EQUALS }]
            tag: [{ value: "Music", op: EQUALS }]
        }
        count: 6
        sort: [{ createdAt: { direction: DESC } }]
    ) {
        nodes {
            modId
            name
            pictureUrl
            endorsements
            author
        }
    }
}`;

async function fetchMods() {
	if (!nexusMods) {
		const res = await fetch('https://api.nexusmods.com/v2/graphql', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ query })
		});

		if (!res.ok) {
			throw new Error(`Error: ${res.status}`);
		}

		const json = await res.json();

		const mods: NexusModType[] = json.data.mods.nodes;

		nexusMods = mods;
	}

	return nexusMods;
}

export default fetchMods;
