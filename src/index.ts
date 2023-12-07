 import { AnyNode } from "cheerio";
import HTML from "./utils/html";
import Http from "./utils/http";
import db from "./utils/db";
import md5 from "md5";
import str from "./utils/str";

interface ISubCategory {
    name: string,
    url: string,
    title: string
}

interface ICategory {
    title: string,
    subCategories: ISubCategory[]
}

type TResult = {
    [name: string]: {
        productName: string,
        avatar: string,
        images: string[],
        sizes: string[]
    }
};

interface IProduct {
    categories: string[],
    discount: string,
    priceBefore: string,
    priceAfter: string,
    description: string,
    colors: (TResult | undefined)[]
}

interface IProductDetail {
    product_id: string,
    size_id: string,
    color_id: string,
    sku: string,
    price: number,
    stock: number
}

interface IProductDetailImage {
    product_detail_id: string,
    image: string
}

interface IColor {
    id?: string,
    name: string,
    image: string
}

interface ICategoryInsert {
    id?: string,
    name: string,
    slug: string
}
interface ISize {
    id?: string,
    name: string
}

type IProductDatabase = {
    name: string,
    sub_description?: string,
    description?: string,
    slug: string
}

type TCategoryProduct = { product_id: string, sub_category_id: string };


class CoolFake {
    private urlOrigin: string;
    public sizes: string[];
    public colors: IColor[];

    constructor() {
        this.urlOrigin = "https://www.coolmate.me";
        this.sizes = [];
        this.colors = [];
    }

    public async getCategories() {
        const [response] = await Http.getCatch(this.urlOrigin);

        if(response === undefined)
            throw Error("Lỗi, không cào được trang chính!");

        const html = new HTML(response);
        const categoryList = html.each<ICategory | undefined>(".nav__sub-item", ($, element) => {

            //ul[rel-script="mega-menu-active"] li
            const title = $(element).children("a").text().trim();
            const c: ISubCategory[] = [];
            if(title.toLowerCase().includes("sale") || title.toLowerCase().includes("Care&Share"))
                return undefined;

            $(element).find(title.toLowerCase() === "sản phẩm" ? "div.grid__column" : `div.mega-menu__item`).each((_, el) => {
                const title = $(el).find("h3.mega-menu__title").text();

                html.find(el, `ul[rel-script="mega-menu-active"] li`, ($, el) => {
                    const a = $(el).children("a");
                    const href = `${this.urlOrigin}${a.attr("href") as string}`.replace("?itm_source=navbar", "");
                    const url = href.replace("https://", "").split("/")[2];
                    const name = a.text().trim() as string;

                    // console.log(a.text().trim())
                    if(url !== undefined && !name.toLowerCase().includes("tất cả"))
                        c.push({ name, url, title });
                })
            });

            return { title, subCategories: c };
        }).filter(Boolean) ;

        return categoryList as ICategory[];
    }

    public async getProducts(categoriesList: ICategory[]) {
        const products = new Map<string, IProduct>();

        type Product = {
            option1: string,
            option2: string
        }

        for(const [index, category] of categoriesList.entries()) {
            for(const subCategory of category.subCategories) {
                console.log(subCategory.name);
                const url = subCategory.url;

                const [response] = await Http.getCatch(`https://www.coolmate.me/collection/products?random=true&seo_alias=${url}&page=1&limit=10000`)
                if(response === undefined || !response?.html)
                    continue;

                const html = new HTML(response.html);

                html.each(".product-grid", async ($, element) => {
                    const productName = $(element).find(`a[rel-script="product-title"]`).text().trim();
                    const productId = $(element).find(`a[rel-script="product-title"]`).attr("href")?.replace("https://", "")
                    .split("/")[2];

                    const elementParent = element;
                    const sizeHash = $(elementParent).find(`form[rel-script="product-script"]`).attr("data-variants") as string;
                    const sizes: Product[] = JSON.parse(sizeHash?.replace(/&quot;/g,'"'));

                    let description = "";

                    if(productId) {
                        const response = await this.getDescription(productId) as { html: string };
                        description = response.html;
                    }

                    if(!products.has(productName)) {
                        const productImageList = html.find(element, ".option-color__item", ($, element) => {
                            const images = $(element).attr("data-images") as string;
                            const title = $(element).attr("data-title") as string;

                            if(title === undefined) return undefined;

                            const avatar = $(element).find(".checkmark").attr("style") as string;
                            const avatarMatch = avatar.match(/background-image: url((.*?));/);

                            let imageList: string[] = [];
                            if(images) {
                                const jsParse: Array<{id: string, src: string}> = JSON.parse(images.replace(/&quot;/g,'"'));
                                imageList = jsParse.map(i => i.src);
                            } else {
                                imageList = html.find<string>(elementParent, "div[rel-script='product-thumbnails']", function($, el) {
                                    return $(el).find("img").attr("src") as string;
                                });
                            }

                            const result: TResult = {
                                [title]: {
                                    productName,
                                    avatar: avatarMatch !== null ? avatarMatch[1].replace("('", "").replace("')", "") : "",
                                    images: imageList,
                                    sizes: []
                                }
                            };

                            sizes.forEach(size => {
                                const check = !this.sizes.includes(size.option2) && size.option2 !== "";
                                check && this.sizes.push(size.option2);

                                if(
                                    size.option1 === title && 
                                    size.option2 !== "" &&
                                    !result[title].sizes.find(s => s === size.option2)
                                ) {
                                    result[title].sizes.push(size.option2);
                                }
                            });
                            
                            if(this.colors.findIndex(color => color.name === title) === -1) {
                                this.colors.push({
                                    name: title,
                                    image: result[title].avatar
                                })
                            }

                            return result
                        }).filter(Boolean);

                        const productPrices = $(element).find(".product-prices");
                        const discount = productPrices.children("span").text().trim() as string;
                        const priceBefore = productPrices.children("del").text().trim();
                        const priceAfter = productPrices.children("ins").text().trim();

                        products.set(productName, {
                            categories: [subCategory.name],
                            discount,
                            priceBefore,
                            priceAfter,
                            colors: productImageList ?? [],
                            description
                        });
                    } else {
                        const product = products.get(productName) as IProduct; 
                        if(!product.categories.includes(subCategory.name))
                            product.categories.push(subCategory.name);
                    }

                });
            }
            // const product = products.get("T-Shirt Care & Share Bản lĩnh") as IProduct;
            // console.log(product.colors);
            // console.log(products)
            // if(index === 2)
            //     break;
                // break;
        }
        // console.log(products);
        return products;
    }

    public async getDescription(productId: string, index: number = 0): Promise<{html: string} | Function> {
        try {
            return Http.get(`https://www.coolmate.me/product/body-html/${productId}`);
        } catch {
            if(index <= 5) return this.getDescription(productId, ++index);
            throw Error("Khong load duoc description");
        }
    }

    public static async start() {
        const coolFake = new CoolFake();
        const categories = await coolFake.getCategories();

        const products = await coolFake.getProducts(categories);

        

        for(const size of coolFake.sizes)
            await db<ISize>("sizes").insert({ name: size });

        for(const color of coolFake.colors)
            await db<IColor>("colors").insert({ name: color.name, image: color.image });    
    
        for(const category of categories) {
            const result = await db<ICategoryInsert>("categories").where("name", "=", category.title).first();
            if(result !== null) {
                console.log(category.title, "đã tồn tại!");
                continue;
            }

            let d = await db<Omit<ICategoryInsert, "slug">>("categories").insert({
                name: category.title
            });

            if(d.status === false) {
                console.log(`Thêm thất bại! bỏ qua...`);
                continue;
            }

            for(const sub of category.subCategories) {
                const r = await db<ICategoryInsert>("sub_categories").where("name", "=", sub.name).first();

                if(r !== null) {
                    await db("categories_subcategories").insert({
                        category_id: d.data?.insertId,
                        sub_category_id: r.id
                    });

                    continue;
                }

                const insertSub = await db<ICategoryInsert>("sub_categories")
                .insert({ 
                    name: sub.name,
                    slug: str.slug(sub.name)
                });
                
                await db("categories_subcategories").insert({
                    category_id: d.data?.insertId,
                    sub_category_id: insertSub.data?.insertId
                });
            }
        }

        for(let [productName, product] of products) {
            if(product.colors.length === 0) continue;

            const productFind = await db<IProductDatabase>("products")
            .where("name", "=", productName).first();

            if(productFind !== null) {
                console.log(productFind.name, "da ton tai")
                continue;
            }

            const productInsert = await db<IProductDatabase>("products").insert({
                name: productName,
                slug: str.slug(productName),
                description: product.description
            });
            
            for(const category of product.categories) {
                const c: any = await db("sub_categories")
                .where("name", "=", category)
                .first();

                if(c === null) continue;

                await db<TCategoryProduct>("categories_products")
                .insert({
                    product_id: productInsert.data?.insertId.toString() as string,
                    sub_category_id: c?.id as string
                });
            }

            for(const color of product.colors) {
                console.log(color)
                if(!color) continue;
                const keys = Object.keys(color);

                for(const colorKey of keys) {
                    const colorDB = await colorFind(colorKey);
                    if(!colorDB) continue;

                    const colorData = color[colorKey];
                    console.log(colorData.sizes)
                    for(const size of colorData.sizes) {
                        const findSize = await sizeFind(size);
                        if(!findSize) continue;

                        console.log(product.priceAfter)
                        // console.log(findSize.id, colorDB.id, productInsert.data?.insertId);
                        // console.log(productName, findSize.name, colorDB.name)
                        const price = product.priceAfter.replace(".", "").replace("đ", "");

                        const productDetail = await db<IProductDetail>("product_details").insert({
                            product_id: productInsert.data?.insertId.toString() as string, 
                            color_id: colorDB.id as string,
                            size_id: findSize.id as string,
                            price: parseInt(price),
                            sku: md5(colorDB.id as string + findSize.id + productInsert.data?.insertId),
                            stock: 50
                        });

                        for(const image of colorData.images) {
                            await db<IProductDetailImage>("product_detail_images")
                            .insert({
                                product_detail_id: productDetail?.data?.insertId.toString() as string,
                                image: image.replace("/image/", "https://media2.coolmate.me/cdn-cgi/image/quality=80,format=auto/uploads/")
                            });
                        }
                    }
                    

                }
            }

        }

        console.log("Thực hiện xong...");
    }
}

async function colorFind(name: string) {
    return db<IColor>("colors").where("name", "=", name).first();
}
async function sizeFind(name: string) {
    return db<ISize>("sizes").where("name", "=", name).first();
}

async function categoryFind(name: string) {
    
}

async function insertProductDetail(productId: string) {

}

CoolFake.start();