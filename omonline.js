const express = require('express');
const fetch = require('node-fetch');
const app = express();
const port = 3000;

const htmlstyle = `
<style>
    .table-shelf {
        overflow: auto;
        white-space: nowrap;
    }

    .search-album {
        display: inline-block;
        background-color:#ededed;
        width:150px;
        height:190px;
        border-radius:12px;
        padding:8px;
        margin:4px;
    }

    .search-album-img {
        width:150px;
        height:150px;
        border-radius:4px;
    }

    .search-album-text {
        width:100px;
        height:50px;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
    }

    .album-page-div {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
    }
</style>
`


function html_search_album(title, artist, img, buttonlink) {
    return(`
    <a href=${buttonlink}>
        <div class="search-album">
            <img class="search-album-img" src="${img}">
            <br>
            <b>${title}</b>
            <br>
            <p>${artist}</p>
        </div>
    </a>
    `)
}

function html_explore_shelves(exploreShelves) {
    // exploreShelves is ExploreShelf[]
    var totalhtml = ""
    for (var a = 0; a < exploreShelves.length; a++) {
        var shelfitems = ""
        totalhtml += `
        <h2>${exploreShelves[a].Title}</h2>
        <div class="table-shelf">
        `
        // add items
        for (var b = 0; b < exploreShelves[a].Albums.length; b++) {
            var album = html_search_album(exploreShelves[a].Albums[b].Title, string_artists(exploreShelves[a].Albums[b].Artists), url_image(exploreShelves[a].Albums[b].Artwork), `/album?id=${exploreShelves[a].Albums[b].AlbumID}`)
            totalhtml += album
        }
        totalhtml += `
        </div>
        `
    }
    return(totalhtml)
}

function html_album_page(searchedAlbum) {
    var totalalbum = `
    <div class="centered-div">
        <img src="${url_image(searchedAlbum.Artwork)}" alt="Sample Image">
        <h1>${searchedAlbum.Title}</h1>
        <table>
    `

    for (var a = 0; a < searchedAlbum.Tracks.length; a++) {
        var playback = searchedAlbum.Tracks[a].Playback_Explicit
        if (playback == null) {
            playback = searchedAlbum.Tracks[a].Playback_Clean
        }
        var song = `
            <tr>
                <td>
                    <a href="/playback?id=${playback}">
                        ${searchedAlbum.Tracks[a].Title}
                    </a>
                </td>
            </tr>
        `
        totalalbum += song
    }

    totalalbum += `
        </table>
    </div>
    `

    return(totalalbum)
}


function string_artists(artists) {
    // artists is SearchedArtist[]
    var strungartists = ""
    if (artists.length == 0) {
        return("Various Artists")
    } else if (artists.length == 1) {
        return(artists[0].Name)
    } else {
        var stringlist = []
        for (var a = 0; a < artists.length; a++) {
            if (a == artists.length - 1) {
                stringlist.push("and " + artists[a].Name)
            } else {
                stringlist.push(artists[a].Name)
            }
        }
        return(stringlist.join(", "))
    }
}

function url_image(ArtworkID) {
    return(`https://lh3.googleusercontent.com/${ArtworkID}=w480-h480-p-l90-rj`)
}





// ENDPOINTS
app.get('/', (req, res) => {
    fetchJson('https://server.openmusic.app/explore')
        .then(data => {
            res.send(`
                ${htmlstyle}
                <h1>Explore</h1>
                ${html_explore_shelves(data.Shelves)}
            `);
        })
        .catch(error => console.error(error));
});

app.get('/album', async (req, res) => {
    const albumId = req.query.id;
    if (!albumId) {
      return res.status(400).send('Album ID is required');
    }
    fetchJson(`https://server.openmusic.app/album?id=${albumId}`)
        .then(data => {
            res.send(`
                ${htmlstyle}
                ${html_album_page(data)}
            `);
        })
        .catch(error => console.error(error));
});

app.get('/playback', async (req, res) => {
    const albumId = req.query.id;
    if (!albumId) {
      return res.status(400).send('Album ID is required');
    }
    fetchJson(`https://server.openmusic.app/playback?id=${albumId}`)
        .then(data => {
            res.redirect(data.Playback_Audio_URL);
        })
        .catch(error => console.error(error));
});





app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

async function fetchJson(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching JSON:', error);
    throw error;
  }
}
