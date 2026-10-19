'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { apiAssetUrl, apiClient } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { AlertCircle, ImagePlus, Loader2, Sprout } from 'lucide-react';

interface ProducePost {
  id: number;
  title: string;
  description?: string | null;
  quantity: number;
  unit: string;
  pricePerUnit?: number | null;
  imageUrl: string;
  postedAt: string;
  crop: { id: number; name: string; nameOm: string };
  farmer: { id: number; name: string; location?: string | null; woreda?: string | null };
}

interface Crop {
  id: number;
  name: string;
}

const emptyForm = {
  title: '',
  cropId: '',
  quantity: '',
  unit: 'kg',
  pricePerUnit: '',
  description: '',
};

export default function ListingsPage() {
  const { user, token } = useAuth();
  const [posts, setPosts] = useState<ProducePost[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadPosts = async () => {
    try {
      setPosts(await apiClient.get<ProducePost[]>('/farmers/posts'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load produce posts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPosts();
    void apiClient.get<Crop[]>('/crops').then(setCrops).catch((err) => {
      setError(err instanceof Error ? err.message : 'Could not load crops.');
    });
  }, []);

  useEffect(() => {
    if (!image) {
      setImagePreview('');
      return;
    }
    const preview = URL.createObjectURL(image);
    setImagePreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [image]);

  const updateForm = (field: keyof typeof emptyForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const selectImage = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] || null;
    setError('');
    if (selected && selected.size > 5 * 1024 * 1024) {
      setImage(null);
      event.target.value = '';
      setError('Choose an image smaller than 5 MB.');
      return;
    }
    setImage(selected);
  };

  const submitPost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !image) {
      setError('Sign in as a farmer and choose a produce photo to post.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');
    const data = new FormData();
    data.append('title', form.title);
    data.append('cropId', form.cropId);
    data.append('quantity', form.quantity);
    data.append('unit', form.unit);
    data.append('description', form.description);
    if (form.pricePerUnit !== '') data.append('pricePerUnit', form.pricePerUnit);
    data.append('image', image);

    try {
      await apiClient.postForm('/farmers/me/posts', data, token);
      setForm(emptyForm);
      setImage(null);
      setSuccess('Your produce post is now live.');
      await loadPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not publish your post.');
    } finally {
      setSaving(false);
    }
  };

  const isFarmer = user?.role === 'FARMER';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Sprout className="h-6 w-6 text-primary-600" />
            Produce listings
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Share what you have available and help buyers find your harvest.
          </p>
        </div>

        {isFarmer && (
          <form onSubmit={submitPost} className="mb-8 rounded-xl border bg-white p-5 shadow-sm sm:p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Post your produce</h2>
            {error && (
              <div role="alert" className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            {success && (
              <p role="status" className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                {success}
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-gray-700">
                Post title
                <input
                  required
                  minLength={2}
                  maxLength={120}
                  value={form.title}
                  onChange={(event) => updateForm('title', event.target.value)}
                  placeholder="e.g. Fresh tomatoes ready for harvest"
                  className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"
                />
              </label>
              <label className="text-sm font-medium text-gray-700">
                Crop
                <select
                  required
                  value={form.cropId}
                  onChange={(event) => updateForm('cropId', event.target.value)}
                  className="mt-1 w-full rounded-lg border bg-white px-3 py-2 font-normal"
                >
                  <option value="">Choose a crop</option>
                  {crops.map((crop) => (
                    <option key={crop.id} value={crop.id}>{crop.name}</option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm font-medium text-gray-700">
                  Quantity
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="any"
                    value={form.quantity}
                    onChange={(event) => updateForm('quantity', event.target.value)}
                    className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"
                  />
                </label>
                <label className="text-sm font-medium text-gray-700">
                  Unit
                  <select
                    value={form.unit}
                    onChange={(event) => updateForm('unit', event.target.value)}
                    className="mt-1 w-full rounded-lg border bg-white px-3 py-2 font-normal"
                  >
                    <option value="kg">kg</option>
                    <option value="quintal">quintal</option>
                    <option value="ton">ton</option>
                    <option value="bag">bag</option>
                  </select>
                </label>
              </div>
              <label className="text-sm font-medium text-gray-700">
                Price per unit (ETB, optional)
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={form.pricePerUnit}
                  onChange={(event) => updateForm('pricePerUnit', event.target.value)}
                  placeholder="Leave blank if negotiable"
                  className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"
                />
              </label>
              <label className="text-sm font-medium text-gray-700 sm:col-span-2">
                Description (optional)
                <textarea
                  maxLength={2000}
                  rows={3}
                  value={form.description}
                  onChange={(event) => updateForm('description', event.target.value)}
                  placeholder="Add details about quality, harvest date, or pickup."
                  className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"
                />
              </label>
              <label className="text-sm font-medium text-gray-700 sm:col-span-2">
                Produce photo (JPEG, PNG, or WebP; max 5 MB)
                <input
                  required
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={selectImage}
                  className="mt-1 block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:font-medium file:text-primary-700"
                />
              </label>
            </div>

            {imagePreview && (
              <div className="relative mt-4 h-52 max-w-sm overflow-hidden rounded-lg border bg-gray-50">
                <Image src={imagePreview} alt="Preview of your produce photo" fill unoptimized className="object-cover" />
              </div>
            )}
            <button
              type="submit"
              disabled={saving || !image}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
              {saving ? 'Publishing…' : 'Publish produce'}
            </button>
          </form>
        )}

        {!isFarmer && error && (
          <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <p className="py-10 text-center text-sm text-gray-500">Loading produce listings…</p>
        ) : posts.length === 0 ? (
          <div className="rounded-xl border bg-white p-10 text-center text-sm text-gray-500">
            No produce has been posted yet. Farmers can add the first listing above.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <article key={post.id} className="overflow-hidden rounded-xl border bg-white shadow-sm">
                <div className="relative h-52 bg-gray-100">
                  <Image src={apiAssetUrl(post.imageUrl)} alt={post.title} fill unoptimized className="object-cover" />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-primary-700">{post.crop.name}</p>
                      <h2 className="mt-1 font-semibold text-gray-900">{post.title}</h2>
                    </div>
                    <p className="shrink-0 text-right text-sm font-semibold text-gray-900">
                      {post.pricePerUnit == null ? 'Price negotiable' : `${post.pricePerUnit} ETB/${post.unit}`}
                    </p>
                  </div>
                  <p className="mt-3 text-sm text-gray-600">
                    {Number(post.quantity).toLocaleString()} {post.unit} available
                  </p>
                  {post.description && <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">{post.description}</p>}
                  <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs text-gray-500">
                    <span>{post.farmer.name}{post.farmer.location ? ` · ${post.farmer.location}` : post.farmer.woreda ? ` · ${post.farmer.woreda}` : ''}</span>
                    <time dateTime={post.postedAt}>{new Date(post.postedAt).toLocaleDateString()}</time>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
