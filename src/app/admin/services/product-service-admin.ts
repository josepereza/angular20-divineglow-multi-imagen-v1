import { inject, Injectable, Signal, signal } from '@angular/core';
import { HttpClient, HttpHeaders, httpResource } from '@angular/common/http';
import { Product } from '../../interfaces/product';
import { AuthService } from './auth-service';

@Injectable({ providedIn: 'root' })
export class ProductServiceAdmin {
  private API_URL = 'http://localhost:3000/productos';
  private productsSignal = signal<Product[]>([]);
    private auth = inject(AuthService);
    private get headers(): HttpHeaders {
    const token = this.auth.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
  }

  products = this.productsSignal;

  constructor(private http: HttpClient) {}
  getProductsRs(){
    return httpResource<Product[] | undefined>(() => `http://localhost:3000/productos`)
  }

   getProductRs(id: Signal<string>){
    return httpResource<Product | undefined>(() => ({
      url: `http://localhost:3000/productos/${id()}`,
    }));
  }

  loadProducts() {
    this.http.get<Product[]>(this.API_URL).subscribe({
      next: (res) => this.productsSignal.set(res),
      error: (err) => console.error('Error cargando productos', err)
    });
  }
 createProduct(product: Product) {
            const { id, ...productWithoutId } = product; // 👈 quitar id del body

    return this.http.post<Product>(this.API_URL, productWithoutId, { headers: this.headers })
      .subscribe(newProduct =>
        this.productsSignal.update(p => [...p, newProduct])
      );
  }
  addProduct(product: Product) {
          const { id, ...productWithoutId } = product; // 👈 quitar id del body

    this.http.post<Product>(this.API_URL, productWithoutId, { headers: this.headers }).subscribe({
      next: (newProd) => {
        const current = this.productsSignal();
        this.productsSignal.set([...current, newProd]);
      },
      error: (err) => console.error('Error al agregar producto', err)
    });
  }

  updateProduct(product: Product) {
    console.log('producto update', product, { headers: this.headers })
      const { id, ...productWithoutId } = product; // 👈 quitar id del body

    this.http.put<Product>(`${this.API_URL}/${product.id}`, productWithoutId,{ headers: this.headers }).subscribe({
      next: (updated) => {
        this.productsSignal.update(products =>
          products.map(p => p.id === updated.id ? updated : p)
        );
        this.loadProducts()
      },
      error: (err) => console.error('Error al actualizar', err)
    });
  }

  deleteProduct(id: number) {
    this.http.delete(`${this.API_URL}/${id}`, { headers: this.headers }).subscribe({
      next: () => {
        this.productsSignal.update(products =>
          products.filter(p => p.id !== id)
        );
      },
      error: (err) => console.error('Error al eliminar', err)
    });
  }
   // ✅ Nuevo método unificado para el formulario
  saveProduct(product: Product) {
    if (product.id) {
      return this.updateProduct(product);
    }
    return this.createProduct(product);
  }
}
