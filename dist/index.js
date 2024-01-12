"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const html_1 = __importDefault(require("./utils/html"));
const http_1 = __importDefault(require("./utils/http"));
const db_1 = __importDefault(require("./utils/db"));
const md5_1 = __importDefault(require("md5"));
const str_1 = __importDefault(require("./utils/str"));
class CoolFake {
    constructor() {
        this.urlOrigin = "https://www.coolmate.me";
        this.sizes = [];
        this.colors = [];
    }
    getCategories() {
        return __awaiter(this, void 0, void 0, function* () {
            const [response] = yield http_1.default.getCatch(this.urlOrigin);
            if (response === undefined)
                throw Error("Lỗi, không cào được trang chính!");
            const html = new html_1.default(response);
            const categoryList = html.each(".nav__sub-item", ($, element) => {
                //ul[rel-script="mega-menu-active"] li
                const title = $(element).children("a").text().trim();
                const c = [];
                if (title.toLowerCase().includes("sale") || title.toLowerCase().includes("Care&Share"))
                    return undefined;
                $(element).find(title.toLowerCase() === "sản phẩm" ? "div.grid__column" : `div.mega-menu__item`).each((_, el) => {
                    const title = $(el).find("h3.mega-menu__title").text();
                    html.find(el, `ul[rel-script="mega-menu-active"] li`, ($, el) => {
                        const a = $(el).children("a");
                        const href = `${this.urlOrigin}${a.attr("href")}`.replace("?itm_source=navbar", "");
                        const url = href.replace("https://", "").split("/")[2];
                        const name = a.text().trim();
                        // console.log(a.text().trim())
                        if (url !== undefined && !name.toLowerCase().includes("tất cả"))
                            c.push({ name, url, title });
                    });
                });
                return { title, subCategories: c };
            }).filter(Boolean);
            return categoryList;
        });
    }
    getProducts(categoriesList) {
        return __awaiter(this, void 0, void 0, function* () {
            const products = new Map();
            for (const [index, category] of categoriesList.entries()) {
                for (const subCategory of category.subCategories) {
                    console.log(subCategory.name);
                    const url = subCategory.url;
                    const [response] = yield http_1.default.getCatch(`https://www.coolmate.me/collection/products?random=true&seo_alias=${url}&page=1&limit=10000`);
                    if (response === undefined || !(response === null || response === void 0 ? void 0 : response.html))
                        continue;
                    const html = new html_1.default(response.html);
                    html.each(".product-grid", ($, element) => __awaiter(this, void 0, void 0, function* () {
                        var _a;
                        const productName = $(element).find(`a[rel-script="product-title"]`).text().trim();
                        const productId = (_a = $(element).find(`a[rel-script="product-title"]`).attr("href")) === null || _a === void 0 ? void 0 : _a.replace("https://", "").split("/")[2];
                        const elementParent = element;
                        const sizeHash = $(elementParent).find(`form[rel-script="product-script"]`).attr("data-variants");
                        const sizes = JSON.parse(sizeHash === null || sizeHash === void 0 ? void 0 : sizeHash.replace(/&quot;/g, '"'));
                        let description = "";
                        if (productId) {
                            const response = yield this.getDescription(productId);
                            description = response.html;
                        }
                        if (!products.has(productName)) {
                            const productImageList = html.find(element, ".option-color__item", ($, element) => {
                                const images = $(element).attr("data-images");
                                const title = $(element).attr("data-title");
                                if (title === undefined)
                                    return undefined;
                                const avatar = $(element).find(".checkmark").attr("style");
                                const avatarMatch = avatar.match(/background-image: url((.*?));/);
                                let imageList = [];
                                if (images) {
                                    const jsParse = JSON.parse(images.replace(/&quot;/g, '"'));
                                    imageList = jsParse.map(i => i.src);
                                }
                                else {
                                    imageList = html.find(elementParent, "div[rel-script='product-thumbnails']", function ($, el) {
                                        return $(el).find("img").attr("src");
                                    });
                                }
                                const result = {
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
                                    if (size.option1 === title &&
                                        size.option2 !== "" &&
                                        !result[title].sizes.find(s => s === size.option2)) {
                                        result[title].sizes.push(size.option2);
                                    }
                                });
                                if (this.colors.findIndex(color => color.name === title) === -1) {
                                    this.colors.push({
                                        name: title,
                                        image: result[title].avatar
                                    });
                                }
                                return result;
                            }).filter(Boolean);
                            const productPrices = $(element).find(".product-prices");
                            const discount = productPrices.children("span").text().trim();
                            const priceBefore = productPrices.children("del").text().trim();
                            const priceAfter = productPrices.children("ins").text().trim();
                            products.set(productName, {
                                categories: [subCategory.name],
                                discount,
                                priceBefore,
                                priceAfter,
                                colors: productImageList !== null && productImageList !== void 0 ? productImageList : [],
                                description
                            });
                        }
                        else {
                            const product = products.get(productName);
                            if (!product.categories.includes(subCategory.name))
                                product.categories.push(subCategory.name);
                        }
                    }));
                }
                // const product = products.get("T-Shirt Care & Share Bản lĩnh") as IProduct;
                // console.log(product.colors);
                //  (products)
                // if(index === 2)
                //     break;
                // break;
            }
            // console.log(products);
            return products;
        });
    }
    getDescription(productId, index = 0) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const r = http_1.default.get(`https://www.coolmate.me/product/body-html/${productId}`)
                    .catch(() => null);
                if (r === null) {
                    console.log(`Khong load duoc`);
                    throw Error("Load không được...");
                }
                return r;
            }
            catch (_a) {
                if (index <= 10)
                    return this.getDescription(productId, ++index);
                throw Error("Khong load duoc description");
            }
        });
    }
    static start() {
        var _a, _b, _c, _d, _e, _f, _g;
        return __awaiter(this, void 0, void 0, function* () {
            const coolFake = new CoolFake();
            const categories = yield coolFake.getCategories();
            const products = yield coolFake.getProducts(categories);
            for (const size of coolFake.sizes)
                yield (0, db_1.default)("sizes").insert({
                    name: size,
                    created_at: new Date(),
                    updated_at: new Date()
                });
            for (const color of coolFake.colors)
                yield (0, db_1.default)("colors").insert({
                    name: color.name,
                    image: color.image,
                    created_at: new Date(),
                    updated_at: new Date()
                });
            for (const category of categories) {
                const result = yield (0, db_1.default)("categories")
                    .where("name", "=", category.title)
                    .first();
                if (result !== null) {
                    console.log(category.title, "đã tồn tại!");
                    continue;
                }
                let d = yield (0, db_1.default)("categories").insert({
                    name: category.title,
                    slug: str_1.default.slug(category.title),
                    created_at: new Date(),
                    updated_at: new Date()
                });
                if (d.status === false) {
                    console.log(`Thêm thất bại! bỏ qua...`);
                    continue;
                }
                for (const sub of category.subCategories) {
                    const r = yield (0, db_1.default)("sub_categories").where("name", "=", sub.name).first();
                    if (r !== null) {
                        yield (0, db_1.default)("categories_subcategories").insert({
                            category_id: (_a = d.data) === null || _a === void 0 ? void 0 : _a.insertId,
                            sub_category_id: r.id
                        });
                        continue;
                    }
                    const insertSub = yield (0, db_1.default)("sub_categories")
                        .insert({
                        name: sub.name,
                        slug: str_1.default.slug(sub.name),
                        created_at: new Date(),
                        updated_at: new Date()
                    });
                    yield (0, db_1.default)("categories_subcategories").insert({
                        category_id: (_b = d.data) === null || _b === void 0 ? void 0 : _b.insertId,
                        sub_category_id: (_c = insertSub.data) === null || _c === void 0 ? void 0 : _c.insertId
                    });
                }
            }
            for (let [productName, product] of products) {
                if (product.colors === undefined || product.colors.length === 0 || product.categories.length === 0)
                    continue;
                if (product.colors === undefined)
                    continue;
                if (product.colors.some(i => i[Object.keys(i)[0]].sizes.length === 0)) {
                    console.log(`${productName} size rong, bo qua...`);
                    continue;
                }
                const productTest = "Tất cổ dài 84RISING Basketball";
                if (productName.includes(productTest)) {
                    console.log(product, product.colors.map(i => console.log(i)));
                }
                const productFind = yield (0, db_1.default)("products")
                    .where("name", "=", productName).first();
                if (productFind !== null) {
                    console.log(productFind.name, "da ton tai");
                    continue;
                }
                const productInsert = yield (0, db_1.default)("products").insert({
                    name: productName,
                    slug: str_1.default.slug(productName),
                    description: product.description.replace(/Coolmate/g, "CoolFake"),
                    created_at: new Date(),
                    updated_at: new Date()
                });
                for (const category of product.categories) {
                    const c = yield (0, db_1.default)("sub_categories")
                        .where("name", "=", category)
                        .first();
                    if (c === null) {
                        console.log(`${category} khong ton tai trong ${productName}, bo qua...`);
                        continue;
                    }
                    yield (0, db_1.default)("categories_products")
                        .insert({
                        product_id: (_d = productInsert.data) === null || _d === void 0 ? void 0 : _d.insertId.toString(),
                        sub_category_id: c === null || c === void 0 ? void 0 : c.id
                    });
                }
                for (const color of product.colors) {
                    // console.log(color)
                    if (!color) {
                        console.log(`${productName} khong thay mau, bo qua...`);
                        continue;
                    }
                    const keys = Object.keys(color);
                    for (const colorKey of keys) {
                        const colorDB = yield colorFind(colorKey);
                        if (!colorDB) {
                            console.log(`Khong tim thay mau ${colorKey} cua ${productName}, bo qua...`);
                            continue;
                        }
                        const colorData = color[colorKey];
                        for (const size of colorData.sizes) {
                            const findSize = yield sizeFind(size);
                            if (!findSize) {
                                console.log(`Khong tim thay size, ${productName}, bo qua...`);
                                continue;
                            }
                            // console.log(findSize.id, colorDB.id, productInsert.data?.insertId);
                            // console.log(productName, findSize.name, colorDB.name)
                            const price = product.priceAfter.replace(".", "").replace("đ", "");
                            const sku = (0, md5_1.default)(colorDB.id + findSize.id + ((_e = productInsert.data) === null || _e === void 0 ? void 0 : _e.insertId) + (Math.floor(Math.random() * 10000) + 1).toString());
                            if (productName.includes(productTest))
                                console.log(`THÊM:: ${productName}, ${colorDB.name}, ${findSize.name}`);
                            const productDetail = yield (0, db_1.default)("product_details").insert({
                                product_id: (_f = productInsert.data) === null || _f === void 0 ? void 0 : _f.insertId.toString(),
                                color_id: colorDB.id,
                                size_id: findSize.id,
                                price: parseInt(price),
                                sku,
                                stock: 50,
                                created_at: new Date(),
                                updated_at: new Date()
                            });
                            if (productDetail.status === false) {
                                console.log(productDetail);
                            }
                            for (const image of colorData.images) {
                                yield (0, db_1.default)("product_detail_images")
                                    .insert({
                                    product_detail_id: (_g = productDetail === null || productDetail === void 0 ? void 0 : productDetail.data) === null || _g === void 0 ? void 0 : _g.insertId.toString(),
                                    image: image.replace("/image/", "https://media2.coolmate.me/cdn-cgi/image/quality=80,format=auto/uploads/")
                                        .replace("/uploads/", "https://media2.coolmate.me/cdn-cgi/image/quality=80,format=auto/uploads/")
                                });
                            }
                        }
                    }
                }
            }
            console.log("Thực hiện xong...");
        });
    }
}
function colorFind(name) {
    return __awaiter(this, void 0, void 0, function* () {
        return (0, db_1.default)("colors").where("name", "=", name).first();
    });
}
function sizeFind(name) {
    return __awaiter(this, void 0, void 0, function* () {
        return (0, db_1.default)("sizes").where("name", "=", name).first();
    });
}
function categoryFind(name) {
    return __awaiter(this, void 0, void 0, function* () {
    });
}
function insertProductDetail(productId) {
    return __awaiter(this, void 0, void 0, function* () {
    });
}
CoolFake.start();
