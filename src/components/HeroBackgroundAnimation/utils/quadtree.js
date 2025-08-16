// Quadtree implementation for efficient spatial queries
export default class Quadtree {
  constructor(bounds, maxObjects = 10, maxLevels = 5, level = 0) {
    this.maxObjects = maxObjects;
    this.maxLevels = maxLevels;
    this.level = level;
    this.bounds = bounds;
    this.objects = [];
    this.nodes = [];
  }
  
  clear() {
    this.objects = [];
    this.nodes.forEach(node => node.clear());
    this.nodes = [];
  }
  
  split() {
    const subWidth = this.bounds.width / 2;
    const subHeight = this.bounds.height / 2;
    const x = this.bounds.x;
    const y = this.bounds.y;
    
    // Top right
    this.nodes[0] = new Quadtree({
      x: x + subWidth,
      y: y,
      width: subWidth,
      height: subHeight
    }, this.maxObjects, this.maxLevels, this.level + 1);
    
    // Top left
    this.nodes[1] = new Quadtree({
      x: x,
      y: y,
      width: subWidth,
      height: subHeight
    }, this.maxObjects, this.maxLevels, this.level + 1);
    
    // Bottom left
    this.nodes[2] = new Quadtree({
      x: x,
      y: y + subHeight,
      width: subWidth,
      height: subHeight
    }, this.maxObjects, this.maxLevels, this.level + 1);
    
    // Bottom right
    this.nodes[3] = new Quadtree({
      x: x + subWidth,
      y: y + subHeight,
      width: subWidth,
      height: subHeight
    }, this.maxObjects, this.maxLevels, this.level + 1);
  }
  
  getIndex(rect) {
    const verticalMidpoint = this.bounds.x + this.bounds.width / 2;
    const horizontalMidpoint = this.bounds.y + this.bounds.height / 2;
    
    const topQuadrant = rect.y < horizontalMidpoint && rect.y + rect.height < horizontalMidpoint;
    const bottomQuadrant = rect.y > horizontalMidpoint;
    
    if (rect.x < verticalMidpoint && rect.x + rect.width < verticalMidpoint) {
      if (topQuadrant) return 1;
      if (bottomQuadrant) return 2;
    } else if (rect.x > verticalMidpoint) {
      if (topQuadrant) return 0;
      if (bottomQuadrant) return 3;
    }
    
    return -1;
  }
  
  insert(object) {
    if (this.nodes.length > 0) {
      const index = this.getIndex(object);
      if (index !== -1) {
        this.nodes[index].insert(object);
        return;
      }
    }
    
    this.objects.push(object);
    
    if (this.objects.length > this.maxObjects && this.level < this.maxLevels) {
      if (this.nodes.length === 0) {
        this.split();
      }
      
      let i = 0;
      while (i < this.objects.length) {
        const index = this.getIndex(this.objects[i]);
        if (index !== -1) {
          this.nodes[index].insert(this.objects.splice(i, 1)[0]);
        } else {
          i++;
        }
      }
    }
  }
  
  retrieve(rect) {
    const returnObjects = [];
    const index = this.getIndex(rect);
    
    if (index !== -1 && this.nodes.length > 0) {
      returnObjects.push(...this.nodes[index].retrieve(rect));
    }
    
    returnObjects.push(...this.objects);
    
    if (this.nodes.length > 0) {
      for (let i = 0; i < this.nodes.length; i++) {
        if (i !== index) {
          const nodeObjects = this.nodes[i].retrieve(rect);
          returnObjects.push(...nodeObjects);
        }
      }
    }
    
    return returnObjects;
  }
}