function initTeams() {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      var jsonMembers = JSON.parse(this.responseText);
      parseRoles(jsonMembers);
      fillRoles(jsonMembers);
    }
  };
  xmlhttp.open("GET", "assets/team/team.json", true);
  xmlhttp.send();
}

function parseRoles(json) {
  var sectionContainer = document.getElementById( "role-container" ) //The role container
  console.log(sectionContainer)
  json.roles.forEach(role => {
      var outerDiv = document.createElement("div") //The outer outer div
      outerDiv.className = "tile is-ancestor"
      sectionContainer.appendChild( outerDiv )
      sectionContainer.appendChild( document.createElement( "br" ) )

      var innerDiv = document.createElement("div") //The outer div. Contains all the text, plus the members div
      innerDiv.className = "tile"
      outerDiv.appendChild( innerDiv )

      var parentInnerDiv = document.createElement("div") //The div contains all the text
      parentInnerDiv.className = "tile is-parent"
      innerDiv.appendChild( parentInnerDiv )

      var article = document.createElement("article") //The arigle used to contain all the information
      article.className = "tile is-child notification is-dark"
      parentInnerDiv.appendChild ( article )


      if(role.img) {
        article.style.backgroundImage = "url('images/" + role.img + "')" //Adds a background
        article.style.backgroundSize = "cover"
      } else {
        article.className += " has-background-black-ter" //Adds a default background
      }


      var titleP = document.createElement( "p" ) //The p element containing the role title
      titleP.className = "title"
      titleP.innerHTML = role.title
      article.appendChild( titleP )

      var whatDoTheyDoP = document.createElement( "p" ) //The p element containing the text "What do they do?"
      whatDoTheyDoP.className = "subtitle is-6"
      whatDoTheyDoP.innerHTML = "What do they do?"
      article.appendChild( whatDoTheyDoP )

      var contentDiv = document.createElement( "div" ) //The div used to hold the description text for this role
      contentDiv.innerHTML = role.content
      article.appendChild( contentDiv )


      var membersDiv = document.createElement( "div" ) //The div used to hold the members information. This is what #fillRoles adds to
      membersDiv.id = role.id
      membersDiv.className = "tile is-parent is-vertical"
      innerDiv.appendChild( membersDiv )

  })
}

function fillRoles(json) {
  json.members.forEach(member => {
    var parentDiv = document.createElement("div"); //Container div for all the elements

    var article = document.createElement("article") //Article containing all the information
    article.className = "tile is-child notification is-dark has-background-black-ter"
    parentDiv.appendChild ( article )

    var figure = document.createElement("figure") //A figure for the minecraft skin picture
    figure.className = "image is-48x48"
    figure.style.float = "left"
    figure.style.marginRight = "20px"
    article.appendChild( figure )

    var image = document.createElement("img") //The image that contains the minecraft skin picture
    image.className = "is-rounded"
    image.src = "https://crafatar.com/avatars/" + member.uuid
    image.alt = member.username
    figure.appendChild( image )

    var socialMediaP = document.createElement("p") //The p element for the member's name
    socialMediaP.className = "title is-4"
    socialMediaP.innerHTML = member.name
    socialMediaP.style.paddingTop = "10px"
    article.appendChild( socialMediaP )

    //Go through all the social media
    Object.keys(member.social).forEach(key => {
      if(member.social[key] != "unset") {
        var element //Ambiguous html element. Depends what is specified for this social. (Either a link or tooltip)
        var clas = "image is-32x32"
        if(json.social[key] == "link") {
          element = document.createElement("a") //Create the link element
          element.href = member.social[key]
          clas += " is-pulled-right is-inline"
        } else if(json.social[key] == "tooltip"){
          element = document.createElement("div") //Create the tooltip element
          element.className = "is-pulled-right tooltip is-tooltip-left"
          element.dataset.tooltip = member.social.discord
        } else {
            throw new Error("Unknown social type: " + key)
        }
        var img = document.createElement("img") //The image for this social media
        img.style.marginLeft = "5px"
        img.className = clas
        img.src = "images/icons/" + key + ".svg"

        element.appendChild( img )
        article.appendChild( element )
      }
    })

    member.projects.forEach(project => {
      var projectInfo = json.teams[project]

      var div = document.createElement("div") //The div containing the tag
      div.className = "tag has-addons is-dark"
      div.style.marginRight = "5px"
      article.appendChild( div )

      var colorSpan = document.createElement("span") //The span for holding the project color
      colorSpan.className = "tag"
      colorSpan.style.backgroundColor = projectInfo.color
      div.appendChild( colorSpan )

      var nameSpan = document.createElement("span") //The span for holding the project name
      nameSpan.className = "tag is-dark"
      nameSpan.innerHTML = projectInfo.name
      div.appendChild( nameSpan )

    })

    member.roles.forEach(role => {
      var doc = document.getElementById(role)
      doc.appendChild( parentDiv.cloneNode( true ) );
      doc.appendChild( document.createElement("br") )
    })
  })
}