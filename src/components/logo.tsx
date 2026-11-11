import Image from "next/image";

const Logo = () => {
  return (
    <Image
      src="/logo.svg"
      alt="Lustora"
      width={160}
      height={44}
      priority
      className="h-auto w-36"
    />
  );
};

export default Logo;