import CategoryList from '@/Components/CategoryList'
import CreateRecipe from '@/Components/CreateRecipe'
import Introheader from '@/Components/Introheader'
import React from 'react'

export default function Home() {
  return (
    <>
      <Introheader />
      <CreateRecipe />
      <CategoryList />
    </>
  )
}