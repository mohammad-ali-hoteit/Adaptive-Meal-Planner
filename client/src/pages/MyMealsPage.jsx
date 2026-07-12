import React, { useState, useEffect, useRef } from 'react';
import API from '../api/axios';

const MyMealsPage = () => {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [ingredients, setIngredients] = useState([]);
  
  // New Ingredient State
  const [newIngName, setNewIngName] = useState('');
  const [newIngKcal, setNewIngKcal] = useState('');
  const [newIngPro, setNewIngPro] = useState('');
  const [newIngCarb, setNewIngCarb] = useState('');
  const [newIngFat, setNewIngFat] = useState('');

  const fileInputRef = useRef(null);

  const fetchMeals = async () => {
    try {
      const res = await API.get('/custom-meals');
      if (res.data.success) {
        setMeals(res.data.meals);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeals();
  }, []);

  const totalMacros = ingredients.reduce((acc, ing) => {
    return {
      kcal: acc.kcal + (Number(ing.kcal) || 0),
      pro: acc.pro + (Number(ing.pro) || 0),
      carb: acc.carb + (Number(ing.carb) || 0),
      fat: acc.fat + (Number(ing.fat) || 0),
    };
  }, { kcal: 0, pro: 0, carb: 0, fat: 0 });

  const handleAddIngredient = () => {
    if (!newIngName || !newIngKcal) return;
    setIngredients([...ingredients, {
      id: Date.now().toString(),
      customName: newIngName,
      kcal: Number(newIngKcal),
      pro: Number(newIngPro) || 0,
      carb: Number(newIngCarb) || 0,
      fat: Number(newIngFat) || 0
    }]);
    setNewIngName('');
    setNewIngKcal('');
    setNewIngPro('');
    setNewIngCarb('');
    setNewIngFat('');
  };

  const handleRemoveIngredient = (id) => {
    setIngredients(ingredients.filter(ing => ing.id !== id));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file) => {
    const authRes = await API.get('/imagekit/auth');
    const { signature, expire, token, publicKey } = authRes.data;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('publicKey', publicKey);
    formData.append('signature', signature);
    formData.append('expire', expire);
    formData.append('token', token);
    formData.append('fileName', file.name);
    formData.append('folder', '/custom_meals');

    const uploadRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST',
      body: formData
    });
    const data = await uploadRes.json();
    return data.url;
  };

  const handleSave = async () => {
    if (!name) return alert('Name is required');
    if (ingredients.length === 0) return alert('Add at least one ingredient');

    setUploading(true);
    try {
      let finalImageUrl = imagePreview; // fallback if editing and no new image
      if (imageFile) {
        finalImageUrl = await uploadImage(imageFile);
      }

      const payload = {
        name,
        image: finalImageUrl,
        ingredients: ingredients.map(ing => ({
          customName: ing.customName,
          kcal: ing.kcal,
          pro: ing.pro,
          carb: ing.carb,
          fat: ing.fat
        }))
      };

      if (editingMeal) {
        await API.put(`/custom-meals/${editingMeal._id}`, payload);
      } else {
        await API.post('/custom-meals', payload);
      }

      setShowModal(false);
      fetchMeals();
    } catch (err) {
      console.error(err);
      alert('Error saving meal');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this meal?')) {
      try {
        await API.delete(`/custom-meals/${id}`);
        fetchMeals();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const openNewModal = () => {
    setEditingMeal(null);
    setName('');
    setIngredients([]);
    setImageFile(null);
    setImagePreview('');
    setShowModal(true);
  };

  const openEditModal = (meal) => {
    setEditingMeal(meal);
    setName(meal.name);
    setIngredients(meal.ingredients.map((ing, i) => ({
      id: ing._id || i.toString(),
      customName: ing.customName || ing.foodId?.name?.en || 'Unknown',
      kcal: ing.kcal || Math.round(ing.foodId?.nutrition?.calories * (ing.grams / (ing.foodId?.size_g || 100)) || 0),
      pro: ing.pro || Math.round(ing.foodId?.nutrition?.protein_g * (ing.grams / (ing.foodId?.size_g || 100)) || 0),
      carb: ing.carb || Math.round(ing.foodId?.nutrition?.carbs_g * (ing.grams / (ing.foodId?.size_g || 100)) || 0),
      fat: ing.fat || Math.round(ing.foodId?.nutrition?.fat_g * (ing.grams / (ing.foodId?.size_g || 100)) || 0),
    })));
    setImageFile(null);
    setImagePreview(meal.image || '');
    setShowModal(true);
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ color: 'var(--color-text)', fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>My Custom Meals</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {/* Create Card */}
        <div 
          onClick={openNewModal}
          style={{ 
            border: '2px dashed var(--color-border)', borderRadius: '16px', display: 'flex', flexDirection: 'column', 
            justifyContent: 'center', alignItems: 'center', cursor: 'pointer', minHeight: '260px', backgroundColor: 'var(--color-bg-secondary)',
            transition: 'all 0.2s ease', color: 'var(--color-text-secondary)'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.color = 'var(--color-accent)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
        >
          <div style={{ fontSize: '64px', fontWeight: '300', marginBottom: '10px' }}>+</div>
          <div style={{ fontWeight: '600', fontSize: '16px' }}>Create New Meal</div>
        </div>

        {/* Existing Meals */}
        {meals.map(meal => (
          <div key={meal._id} style={{ border: '1px solid var(--color-border)', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <div style={{ height: '160px', backgroundColor: '#eee', backgroundImage: meal.image ? `url(${meal.image})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
              {!meal.image && <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '14px' }}>No Image</div>}
            </div>
            <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: 'var(--color-text)' }}>{meal.name}</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '20px', fontWeight: '600' }}>
                <span style={{ color: 'var(--color-accent)' }}>🔥 {meal.kcal}</span>
                <span>P: {meal.pro}g</span>
                <span>C: {meal.carb}g</span>
                <span>F: {meal.fat}g</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                <button onClick={() => openEditModal(meal)} style={{ flex: 1, padding: '10px', border: '1px solid var(--color-border)', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer', fontWeight: '600', color: 'var(--color-text)' }}>Edit</button>
                <button onClick={() => handleDelete(meal._id)} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#ef4444', cursor: 'pointer', fontWeight: '600' }}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '20px', width: '90%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '22px', color: 'var(--color-text)' }}>{editingMeal ? 'Edit Custom Meal' : 'Create Custom Meal'}</h2>
              <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'none', fontSize: '28px', cursor: 'pointer', color: '#9ca3af' }}>×</button>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--color-text)', fontSize: '14px' }}>Meal Name</label>
              <input type="text" placeholder="e.g., Mom's Lasagna" value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--color-border)', fontSize: '15px' }} />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--color-text)', fontSize: '14px' }}>Image (Optional)</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                style={{ height: '140px', border: '2px dashed var(--color-border)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundImage: `url(${imagePreview})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#f9fafb' }}
              >
                {!imagePreview && <span style={{ color: '#6b7280', fontWeight: '500' }}>Click to upload image</span>}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleImageSelect} style={{ display: 'none' }} accept="image/*" />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: 'var(--color-text)' }}>Ingredients</h3>
              {ingredients.map(ing => (
                <div key={ing.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#f9fafb', border: '1px solid var(--color-border)', borderRadius: '10px', marginBottom: '10px' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '15px', color: 'var(--color-text)', marginBottom: '4px' }}>{ing.customName}</strong>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>{ing.kcal} kcal • P: {ing.pro}g • C: {ing.carb}g • F: {ing.fat}g</div>
                  </div>
                  <button onClick={() => handleRemoveIngredient(ing.id)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>Remove</button>
                </div>
              ))}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginTop: '16px', backgroundColor: '#f3f4f6', padding: '16px', borderRadius: '10px' }}>
                <input type="text" placeholder="Ingredient Name" value={newIngName} onChange={e => setNewIngName(e.target.value)} style={{ flex: '1 1 100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }} />
                <div style={{ display: 'flex', gap: '8px', flex: '1 1 100%' }}>
                  <input type="number" placeholder="kcal" value={newIngKcal} onChange={e => setNewIngKcal(e.target.value)} style={{ width: '25%', padding: '10px 8px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }} />
                  <input type="number" placeholder="Pro" value={newIngPro} onChange={e => setNewIngPro(e.target.value)} style={{ width: '25%', padding: '10px 8px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }} />
                  <input type="number" placeholder="Carb" value={newIngCarb} onChange={e => setNewIngCarb(e.target.value)} style={{ width: '25%', padding: '10px 8px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }} />
                  <input type="number" placeholder="Fat" value={newIngFat} onChange={e => setNewIngFat(e.target.value)} style={{ width: '25%', padding: '10px 8px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }} />
                </div>
                <button onClick={handleAddIngredient} style={{ width: '100%', padding: '12px', backgroundColor: 'var(--color-text)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', marginTop: '4px' }}>Add Ingredient</button>
              </div>
            </div>

            <div style={{ padding: '20px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#166534', fontSize: '15px' }}>Live Total Nutrition</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '700', color: '#15803d' }}>
                <span>🔥 {totalMacros.kcal} kcal</span>
                <span>💪 {totalMacros.pro}g</span>
                <span>🍞 {totalMacros.carb}g</span>
                <span>🥑 {totalMacros.fat}g</span>
              </div>
            </div>

            <button onClick={handleSave} disabled={uploading} style={{ width: '100%', padding: '16px', backgroundColor: 'var(--color-accent)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: uploading ? 'not-allowed' : 'pointer', transition: 'opacity 0.2s', opacity: uploading ? 0.7 : 1 }}>
              {uploading ? 'Saving...' : 'Save Custom Meal'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyMealsPage;
