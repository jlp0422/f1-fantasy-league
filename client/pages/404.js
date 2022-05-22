import Layout from 'components/Layout'
import Image from 'next/image'
import max404 from '../public/max-404.gif'

const Custom404 = () => {
  return (
    <Layout documentTitle="404" description="404 Page">
      <div className="mx-auto my-0 w-500 h-500">
        <Image
          layout="fixed"
          width={500}
          height={500}
          src={max404}
          alt="Max Verstappen kicking tyre"
        />
      </div>
    </Layout>
  )
}

export default Custom404
