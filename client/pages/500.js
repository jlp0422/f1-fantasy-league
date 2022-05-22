import Layout from 'components/Layout'
import Image from 'next/image'
import mazepin from '../public/mazepin-500.gif'

const Custom500 = () => {
  return (
    <Layout
      pageTitle="500 OUT OF CONTROL"
      documentTitle="500"
      description="500 Page"
    >
      <div className="mx-auto my-0 w-500 h-500">
        <Image
          layout="fixed"
          width={498}
          height={280}
          src={mazepin}
          alt="Mazepin Mazespin"
        />
      </div>
    </Layout>
  )
}

export default Custom500
