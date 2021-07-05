//NOTE: IN THIS PROJECT WE WILL STORE ALL THE DETAILS OF THE PRODUCTS IN THE CART LOCALLY SO WHEN WE REFRESH, THEY ARE STILL PRESENT


//Contentful (Storing products globally)
const client = contentful.createClient({
  // This is the space ID. A space is like a project folder in Contentful terms
  space: "ttfxja62zscc",
  // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
  accessToken: "ab-k1i6sCgVfe9ya9Zzekn5w9DwzJw07NKV3GgxYsZE"
});
//console.log(client);


//Selecting all required elements using queryselector using classes.
//Variable declaration
const cartBtn = document.querySelector(".cart-btn");
const closeCartBtn = document.querySelector(".close-cart");
const clearCartBtn = document.querySelector(".clear-cart");
const cartDOM = document.querySelector(".cart");
const cartOverlay = document.querySelector(".cart-overlay");
const cartItems = document.querySelector(".cart-items");
const cartTotal = document.querySelector(".cart-total");
const cartContent = document.querySelector(".cart-content");
const productsDOM = document.querySelector(".products-center");


//Main cart with all info
let cart = [];
//Buttons
let buttonsDOM = [];


//Gets the products
class Products {

    //Methods
    async getProducts(){
        //Get products from json
        //As the request is asynchronous, we may need to wait hence we use async and await
        try {

            //Contentful API Call so you dont need to store the products locally
            let contentful = await client.getEntries({
                content_type: "comfyHouseProduct"
            });
            //console.log(contentful);
            let products = contentful.items;


/*            //fetch -> API to fetch json data
            let result = await fetch('products.json');
            let data = await result.json();
            //let products = data.items;
*/            
            //Mapping products in a simpler form
            products = products.map(item => {
                const {title,price} = item.fields;
                const {id} = item.sys;
                const image = item.fields.image.fields.file.url;
                return {title,price,id,image};
            });
            return products;

        } catch(error){
            console.log(error);
        }
    }
}


//Display products. And most methods
class UI{

    //Displays the methods by putting them in the HTML
    displayProducts(products){
        //console.log(products);
        let result = '';

        //Loop over products array and place them wrapped in html
        products.forEach(product => {
            result += `
            <!-- Single product -->
                <article class="product">
                    <div class="img-container">
                        <img 
                            src=${product.image} 
                            alt="product1" 
                            class="product-img">
                        <button class="bag-btn" data-id=${product.id}>
                            <i class="fas fa-shopping-cart"></i>
                            add to cart
                        </button>
                    </div>
                    <h3>${product.title}</h3>
                    <h4>₹${product.price}</h4>
                </article>
            <!-- End of single product -->
            `
        });

        //Changes the HTML code inside this DOM element
        productsDOM.innerHTML = result;
    }

    getBagButtons(){

        //We added the [...   ] so that btns is stored as an array and not a NodeList
        const buttons = [...document.querySelectorAll(".bag-btn")];
        buttonsDOM = buttons;

        buttons.forEach(button => {
            let id = button.dataset.id;
            let inCart = cart.find(item => item.id === id);
            if(inCart){

                //If the product is in the cart disable the button
                button.innerText = "In Cart";
                button.disabled = true;
            }

            //Wait for click
            button.addEventListener('click',(event) => {
                
                //When there is a click, disable button
                event.target.innerText = "In Cart";
                event.target.disabled = true;

                //Get product from products based on the id

                //spread operator. Add a property => amount
                let cartItem = {...Storage.getProduct(id),amount:1};
                //console.log(cartItem);

                //Add product to the cart
                //spread operator(...) gets all items and adds if we add sommething after ...
                cart = [...cart,cartItem];
                //console.log(cart);

                //Save cart in local storage
                Storage.saveCart(cart);

                //Set values of the cart and cart total
                this.setCartValues(cart);

                //Display cart item
                this.addCartItem(cartItem);

                //Show the cart
                this.showCart();
            });
        });
    }

    setCartValues(cart){
        let priceTotal = 0;
        let itemsTotal = 0;

        cart.map(item => {
            priceTotal += item.price * item.amount;
            itemsTotal += item.amount;
        });
        
        //parseFloat so it becomes a float from string;
        cartTotal.innerText = parseInt(priceTotal);
        cartItems.innerText = itemsTotal;
        //console.log(cartTotal,cartItems);
    }

    addCartItem(item){
        const div = document.createElement('div');
        div.classList.add('cart-item');
        div.innerHTML = `
                <img 
                    src=${item.image} 
                    alt="product1">
                <div>
                    <h4>${item.title}</h4>
                    <h5>₹${item.price}</h5>
                    <span 
                        class="remove-item" 
                        data-id=${item.id}>Remove</span>
                </div>
                <div>
                    <i 
                        class="fas fa-chevron-up"
                        data-id=${item.id}></i>
                    <p class="item-amount">${item.amount}</p>
                    <i 
                        class="fas fa-chevron-down"
                        data-id=${item.id}></i>
                </div>
        `;
        cartContent.appendChild(div);
        //console.log(cartContent);
    }

    showCart(){
        cartOverlay.classList.add('transparentBg');
        cartDOM.classList.add('showCart');
    }

    hideCart(){
        cartOverlay.classList.remove('transparentBg');
        cartDOM.classList.remove('showCart');
    }

    setUpAPP(){
        cart = Storage.getCart();
        this.setCartValues(cart);
        this.populate(cart);
        cartBtn.addEventListener('click',this.showCart);
        closeCartBtn.addEventListener('click',this.hideCart);
    }

    populate(cart){
        cart.forEach(item => this.addCartItem(item));
    }

    cartLogic(){
        
        //Clear cart button
        //need: () => {} or else 'this' will point to the button and not the UI class
        //clearCartBtn.addEventListener('click',this.clearCart);
        clearCartBtn.addEventListener('click', () => {
            this.clearCart();
        });
        
        //Cart functionality
        //Event bubling
        cartContent.addEventListener('click', event => {
            //console.log(event.target);

            if(event.target.classList.contains('remove-item')){

                let removeItem = event.target;
                //console.log(removeItem);
                let id = removeItem.dataset.id;
                
                //Remove from cart and set cart values
                this.removeItem(id);

                //Remove item from DOM
                cartContent.removeChild(removeItem.parentElement.parentElement);
            }
            else if(event.target.classList.contains('fa-chevron-up')){
                let addAmountElement = event.target;
                let id = addAmountElement.dataset.id;
                //console.log(addAmountElement);

                //Update amount of that item
                let tempItem = cart.find(item => item.id === id);
                tempItem.amount++;
                //console.log(tempItem);

                //Save in local storage and set cart values
                Storage.saveCart(cart);
                this.setCartValues(cart);
                
                //Update DOM element
                addAmountElement.nextElementSibling.innerText = tempItem.amount;
            }
            else if(event.target.classList.contains('fa-chevron-down')){
                let reduceAmountElement = event.target;
                let id = reduceAmountElement.dataset.id;
                //console.log(reduceAmountElement);

                //Update amount of that item
                let tempItem = cart.find(item => item.id === id);
                
                //Need to check if on removing, amount equals zero or not
                if(tempItem.amount==1){
                
                    //Remove from cart and set cart values
                    this.removeItem(id);

                    //Remove item from DOM
                    cartContent.removeChild(reduceAmountElement.parentElement.parentElement);
                }
                else{
                    tempItem.amount--;
                    //console.log(tempItem);

                    //Save in local storage and set cart values
                    Storage.saveCart(cart);
                    this.setCartValues(cart);
                
                    //Update DOM element
                    reduceAmountElement.previousElementSibling.innerText = tempItem.amount;
                }
            }
        });
    }

    clearCart(){
        //console.log(this);
        let cartItems = cart.map(item => item.id);
        cartItems.forEach(id => this.removeItem(id));

        //Remove all cart items (children) from HTML
        //console.log(cartContent.children);
        while(cartContent.children.length>0){
            cartContent.removeChild(cartContent.children[0]);
        }
        //console.log(cartContent.children);

        this.hideCart();
    }

    //Removes item from cart
    removeItem(id){

        //For each cart item, if the id is not equal to the id, we will include it in the cart as we wont remove that
        cart = cart.filter(item => item.id!==id);
        this.setCartValues(cart);

        //Save latest cart locally
        Storage.saveCart(cart); 

        //Restoring button
        let button = this.getSingleButton(id);
        button.disabled = false;
        button.innerHTML = `<i class="fas fa-shopping-cart"></i>
                            add to cart`;  //CHECK
    }

    getSingleButton(id){
        return buttonsDOM.find(button => button.dataset.id===id);
    }
}


//Local storage
class Storage{

    //Static method so we dont need to instantiate it
    static saveProducts(products){
        //Stringify => toString. Need to set as string in local storage
        //setItem is a predefined local storage method 
        localStorage.setItem("products",JSON.stringify(products));
    }

    static getProduct(id){
        //Need to json parse as we had saved it as a string in the local storage
        //Will store array of products and return product with matching id
        let products = JSON.parse(localStorage.getItem('products'));
        return products.find(product => product.id===id);
    }

    static saveCart(cart){
        //Stringify => toString. Need to set as string in local storage
        //setItem is a predefined local storage method 
        localStorage.setItem("cart",JSON.stringify(cart));
    }

    static getCart(){
        //First check if the item exists or not. Say cart hasnt been added yet
        return localStorage.getItem('cart') ? JSON.parse(localStorage.getItem('cart')) : [];
    }
}


document.addEventListener("DOMContentLoaded",() => {
    
    //Making instances of the class
    const ui = new UI();
    const products = new Products();

    //Set up application
    ui.setUpAPP();

    //Get all products
    //.then chains the instructions and they will only be executed once the previous one is complete
    products.getProducts().then(products => {

        //Displays the products after getting them from the json file and stores them in local storage
        ui.displayProducts(products);
        Storage.saveProducts(products);
    }).then(() => {

        //Work on the buttons done here
        //Adds items to cart on button click and other functionalities
        ui.getBagButtons();
        ui.cartLogic();
    });
});
