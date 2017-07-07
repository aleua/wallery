/**
 * Map class
 * This class contain all the information about a mapping
 * 
 * WARNING!
 * All the sizes are in units, not in pixels
 *
 * @param int     unit      Unit size in px
 * @param int     width     Map size in unit
 * @param int     height    Map height in unit
 */

function WalleryMap ( unit, width, height ) {
    
  // Sucurity tests
  if ( width <= 0 && height <= 0 && unit <= 0 )
    return false;
  
  // Settings
  this.width  = width;
  this.height = height;
  this.unit   = unit;
  
  // Get the size of the map
  this.size = this.width * this.height;
  this.freeSpace = this.size;
  this.result = [];
  
  // Map initialisation
  this.table = [];
  
  var newLine, i, j;
  for (i=0; i<this.width; i++) {
    newLine = [];
    for (j=0; j<this.height; j++) {
      newLine.push(false);
    }
    this.table.push(newLine);
  }
}
  
/**
 * Basic check on values
 * 
 * @param   int     posX    Pos X in unit
 * @param   int     posY    Pos Y in unit
 * @param   int     width   Width in unit
 * @param   int     height  Height in unit
 * @return  Boolean         True if the values are ok
 */
WalleryMap.prototype.valuesCheck = function (posX, posY, width, height) {
  
  // Security tests
  // > Positions out of map or null sizes
  if ( posX < 0 || posY < 0 || width <= 0 || height <= 0 )
    return false;
    
  // > Overflow
  if ((posX + width > this.width) || (posY + height > this.height))
    return false;
  
  // Everything is OK
  return true;
};
  
/**
 * Check if a zone is free on the map
 * 
 * @param   int   posX    Pos X in unit
 * @param   int   posY    Pos Y in unit
 * @param   int   width   Width in unit
 * @param   int   height  Height in unit
 * @return  Boolean       True if the values are ok
 */
WalleryMap.prototype.placeCheck = function (posX, posY, width, height) {
  
  // Security tests
  if ( !this.valuesCheck (posX, posY, width, height) )
    return false;
  
  // Treatment
  var i, j;
  for (i=0; i<width; i++) {
    for (j=0; j<height; j++) {
      if ( this.table[posX + i][posY + j] === true ) {
        return false; // This place is already taken
      }
    }
  }

  // The place is free
  return true;
};

/**
 * Method to put an item 
 * 
 * @param   WalleryItem item      Item to set    
 * @param   int         posX      Position on X where to put the item (in units)
 * @param   int         posY      Position on Y where to put the item (in units)
 * @param   int         width     Width of the place to put the item (in units)
 * @param   int         height    Height of the place to put the item (in units) 
 * @param   boolean     testr     Do we need to check if the place is free before to put the item ?
 * @return  boolean               True if it's a success
 */
WalleryMap.prototype.putItem = function (item, posX, posY, width, height, testr) {
  
  // Security tests
  if ( testr === true ) {
    if ( !this.placeCheck (posX, posY, width, height) )
      return false;
  }
  else {
    if ( !this.valuesCheck (posX, posY, width, height) )
      return false;
  }

  // Set default values
  if (width === undefined)  width = item.widthUnit;
  if (height === undefined) height  = item.heightUnit;
  
  // Treatement
  var i, j, size;
  for (i=0; i<width; i++) {
    for (j=0; j<height; j++) {
      this.table[posX + i][posY + j] = true;
    }
  }
  
  // Get the size of the item put in place
  size = width * height;
  
  // Update the free space of the map
  this.freeSpace -= size;
  
  // Add this item in the result array
  this.result.push({
    item    : item,
    posX    : (posX * this.unit),
    posY    : (posY * this.unit),
    width   : (width * this.unit),
    height  : (height * this.unit)
  });
  
  // Update the item counter
  item.incUsemeter();
  
  // Everything is OK
  return true;
};
  
/**
 * Put an item into a random place
 * The algorithm accept 2 params : the item to place and the number of tentatives
 * We get a random position on the map, try if it fit
 * if so we place it.
 * otherwise we try again (and this for the amount of try we set)
 * 
 * @param   WalleryItem object        Item object to place
 * @param   int         nbTentatives  Number of tentative before to fail 
 * @return  array                     Position or false
 */
WalleryMap.prototype.putToRandomPlace = function (item, nbTentatives) {
  
  // Random test to find a place on the map
  var positionToTry;
  var isPlaced = false;
  
  while ( !isPlaced && (nbTentatives > 0) ) {
    
    nbTentatives--;
    positionToTry = this.getRandomPlace( item.widthUnit, item.heightUnit );
    isPlaced    = this.placeCheck(
      positionToTry.x,
      positionToTry.y,
      item.widthUnit,
      item.heightUnit
    );
  }
  
  // If place has been find we put the item
  // Else we try manually (but it need more ressources and time)
  if (isPlaced) {
    
    this.putItem( item,
            positionToTry.x,
            positionToTry.y);

    return positionToTry;
  }

  return false;
};

/**
 * This method force to place an item in the map
 * The first step is to get all the free combinaisons available
 * then choose one randomly to place the object
 * then we return the position.
 * If there's no space, we return false.
 * 
 * @param   WalleryItem object    Item object to place
 * @return  array                 Position or false
 */
WalleryMap.prototype.forceRandomPlace = function (item) {

  // In this case the random case hasn't been nice with us
  // => We gonna find a place manually
  var positionsList = this.findPlace( item.widthUnit, item.heightUnit );
  
  if (positionsList === false)
    return false;
  
  var theOne = Math.ceil(Math.random() * positionsList.length) % positionsList.length;
  this.putItem( item,
          positionsList[theOne].x,
          positionsList[theOne].y);

  return positionsList[theOne];
};

/**
 * Method to find a place in this map
 * You just have to give the width and height of the item to put in the map.
 * It will return an array with the position availables
 * 
 * @param   int   width       Width of the place to put the item (in units)
 * @param   int   height      Height of the place to put the item (in units) 
 * @param   int   amountMax   Maximum amount of result returned (min: 1)
 * @return  array             List of free positions [{x(int), y(int)}]
 */
WalleryMap.prototype.findPlace = function (width, height, amountMax) {
  
  var x, y;
  var combinaisons = [];
  amountMax = (amountMax === undefined || amountMax < 1) ? this.size : amountMax;

  for (x = 0; x + width <= this.width; x++) {
    for (y = 0; y + height <= this.height; y++) {
      if (this.placeCheck(x, y, width, height)) {
        combinaisons.push({ x:  x,
                  y:  y });
        if (combinaisons.length == amountMax)
          return combinaisons;
      }
    }
  }
  
  // Return
  if (combinaisons.length === 0) {
    return false;
  } else {
    return combinaisons;
  }
};


/**
 * Method to get a random place in the map
 * But warning, the place can be taken
 * The setting are the dimensions of the item you want to put
 * 
 * @param   int   width    Width of the place to put the item (in units)
 * @param   int   height   Height of the place to put the item (in units) 
 * @return  array          The random position {x(int), y(int)}
 */
WalleryMap.prototype.getRandomPlace = function (width, height) {
  
  return {x:  Math.ceil(Math.random() * (this.width - width)),
      y:  Math.ceil(Math.random() * (this.height - height))};
};

/**
 * Make the final rendering
 * 
 * @param   int    margin  Margin in pixel
 * @return  string         HTML rendered
 */
WalleryMap.prototype.rendering = function (tplFunction) {

  var wrapper = document.createElement('div');
  var place, tplData;

  for (var i in this.result) {

    place = this.result[i];

    tplData = {
      place: {
        posX: place.posX,
        posY: place.posY,
        width:  place.width,
        height: place.height
      },
      item: {
        width:  place.item.widthPx,
        height: place.item.heightPx,
      },
      data:   place.item.attached
    };

    tplData.item.posX = Math.ceil(Math.random() * (tplData.item.width  - tplData.place.width  ));
    tplData.item.posY = Math.ceil(Math.random() * (tplData.item.height - tplData.place.height ));

    wrapper.appendChild(tplFunction(tplData));
  }

  return wrapper;
};

  
/* Debug *****************************************************************/

/**
 * Display the map in text on the output
 */
WalleryMap.prototype.displayMap = function () {

  var i, j, row;
  for (j=0; j<this.height; j++) {
    row = '';
    for (i=0; i<this.width; i++) {
      if ( this.table[i][j] )
        row += '#';
      else
        row += '.';
    }
    console.log(row);
  }
};